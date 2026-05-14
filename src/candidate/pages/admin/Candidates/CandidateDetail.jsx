import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, BriefcaseBusiness, ClipboardList, ExternalLink, Eye, FileImage, MapPin, Pencil, Trash2, Upload, UserRound, Users, X } from 'lucide-react'
import api, { assetUrl } from '../../../api/axios'
import { ConfirmDialog } from '../../../components/ActionDialogs'
import {
  allCandidateDocumentTypes,
  candidateDocumentTypes,
  successDocumentTypes
} from '../../../constants/candidateDocuments'
import {
  DIRECTOR_ASSESSMENT_FIELDS,
  DIRECTOR_MODE_VALUES,
  DIRECTOR_RATING_VALUES,
  DIRECTOR_YES_NO_VALUES,
  MANAGER_ASSESSMENT_FIELDS,
  PERSONALITY_RATING_FIELDS,
  PROFESSIONAL_RATING_FIELDS,
  RATING_VALUES,
  SUCCESS_INFO_FIELDS,
  calculateQuestionMarksResult,
  interviewHasContent,
  mapApiToCandidateForm
} from './candidateFormModel'

const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none'
const textAreaClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none'
const labelClass = 'text-sm font-semibold text-slate-700'
const cardClass = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5'

const dateLabel = (value) => (value ? String(value).slice(0, 10) : '')
const fieldValue = (value) => (value === null || value === undefined ? '' : String(value))
const editablePanels = new Set(['details', 'documents', 'successInfo', 'assessment', 'interviews'])
const panelFromSearch = (searchParams) => {
  const panel = searchParams.get('panel')
  return editablePanels.has(panel) ? panel : 'details'
}
const isImageDocument = (doc) => String(doc?.mimeType || '').startsWith('image/') || /\.(jpe?g|png)$/i.test(String(doc?.fileName || doc?.fileUrl || ''))

const interviewDocumentTypes = [
  { key: 'appointmentLetter', label: 'Appointment Letter' },
  { key: 'offerLetter', label: 'Offer Letter' },
  { key: 'interviewLetter', label: 'Interview Letter' },
  { key: 'confirmationLetter', label: 'Confirmation Letter' }
]

const documentKeyByLabel = allCandidateDocumentTypes.reduce((acc, item) => {
  acc[String(item.label || '').trim().toLowerCase()] = item.key
  return acc
}, {})
const knownCandidateDocumentKeys = new Set(allCandidateDocumentTypes.map((item) => item.key))

const normalizeDocToken = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const resolveCandidateDocumentType = (doc = {}) => {
  if (doc.documentType && knownCandidateDocumentKeys.has(String(doc.documentType))) return String(doc.documentType)
  const labelKey = String(doc.documentLabel || '').trim().toLowerCase()
  if (documentKeyByLabel[labelKey]) return documentKeyByLabel[labelKey]

  const normalizedLabel = normalizeDocToken(doc.documentLabel || doc.fileName)
  const alias = {
    updatedresume: 'updatedResume',
    tenthcertificate: 'tenthCertificate',
    tenthclasscertificate: 'tenthCertificate',
    tenthstdcertificate: 'tenthCertificate',
    class10certificate: 'tenthCertificate',
    sscertificate: 'tenthCertificate',
    ssccertificate: 'tenthCertificate',
    twelfthcertificate: 'twelfthCertificate',
    twelfthclasscertificate: 'twelfthCertificate',
    twelfthstdcertificate: 'twelfthCertificate',
    class12certificate: 'twelfthCertificate',
    hsccertificate: 'twelfthCertificate',
    graduatecertificate: 'graduateCertificate',
    graduationcertificate: 'graduateCertificate',
    degreecertificate: 'graduateCertificate',
    postgraduatecertificate: 'postGraduateCertificate',
    pgcertificate: 'postGraduateCertificate',
    postgraduationcertificate: 'postGraduateCertificate',
    experienceletter: 'experienceLetter',
    salaryslip: 'salarySlip',
    bankstatement: 'bankStatement',
    mscitcertificate: 'msCitCertificate',
    mscit: 'msCitCertificate',
    ccccertificate: 'cccCertificate',
    ccc: 'cccCertificate',
    advancedexcelcertificate: 'advancedExcelCertificate',
    advancedexcel: 'advancedExcelCertificate',
    powerpointcertificate: 'powerPointCertificate',
    powerpoint: 'powerPointCertificate',
    pptcertificate: 'powerPointCertificate',
    tallycertificate: 'tallyCertificate',
    tally: 'tallyCertificate',
    autocadcertificate: 'autoCadCertificate',
    autocad: 'autoCadCertificate',
    typingcertificate: 'typingCertificate',
    typing: 'typingCertificate',
    catiacertificate: 'catiaCertificate',
    catia: 'catiaCertificate',
    computercoursescertificate: 'computerCourseCertificate',
    computercoursecertificate: 'computerCourseCertificate',
    aadharcard: 'aadharCard',
    aadhaarcard: 'aadharCard',
    pancard: 'panCard',
    passportsizephoto: 'passportSizePhoto',
    medicalfitnesscertificates: 'medicalFitnessCertificate',
    medicalfitnesscertificate: 'medicalFitnessCertificate',
    hamipatra: 'hamiPatra',
    hphamipatra: 'hamiPatra',
    concernletter: 'concernLetter',
    clconcernletter: 'concernLetter',
    selectedvideo: 'selectedVideo',
    feedbackvideo: 'selectedVideo',
    selectedfeedbackvideo: 'selectedVideo',
    jobjoininghamipatra: 'jobJoiningHamiPatra',
    candidatephoto: 'candidatePhoto',
    photoofcandidates: 'candidatePhoto',
    photoofcandidatewithletterreceipt: 'candidatePhoto',
    letterreceiptphoto: 'candidatePhoto',
    formalphoto: 'candidatePhoto'
  }

  return alias[normalizedLabel] || ''
}

const groupCandidateDocumentsByType = (documents = []) => {
  const grouped = {}
  ;(Array.isArray(documents) ? documents : []).forEach((doc) => {
    const type = resolveCandidateDocumentType(doc)
    if (!type) return
    grouped[type] = grouped[type] || []
    grouped[type].push(doc)
  })
  return grouped
}

const unmatchedCandidateDocuments = (documents = []) =>
  (Array.isArray(documents) ? documents : []).filter((doc) => !resolveCandidateDocumentType(doc))

const groupInterviewDocumentsByType = (documents = []) => {
  const allowed = new Set(interviewDocumentTypes.map((item) => item.key))
  const grouped = {}
  ;(Array.isArray(documents) ? documents : []).forEach((doc) => {
    const type = String(doc?.documentType || '')
    if (!allowed.has(type)) return
    grouped[type] = grouped[type] || []
    grouped[type].push(doc)
  })
  return grouped
}

const formatDocumentDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className={`${cardClass} space-y-5`}>
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {Icon ? (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, className = '', children }) {
  return (
    <label className={`${labelClass} ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function FieldGroup({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        {Icon ? <Icon className="h-4 w-4 text-indigo-500" /> : null}
        {title}
      </h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  )
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-3 text-sm font-semibold ${
        active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function ReadOnlyInput({ value, type = 'text', placeholder, onEditHint }) {
  return (
    <input
      className={`${inputClass} cursor-pointer`}
      type={type}
      value={fieldValue(value)}
      placeholder={placeholder}
      readOnly
      onClick={onEditHint}
    />
  )
}

function ReadOnlyTextArea({ value, rows = 4, onEditHint }) {
  return <textarea className={`${textAreaClass} cursor-pointer`} rows={rows} value={fieldValue(value)} readOnly onClick={onEditHint} />
}

function DocumentCard({ doc }) {
  const url = assetUrl(doc.fileUrl)
  const uploadedAt = formatDocumentDate(doc.uploadedAt)
  const canPreview = isImageDocument(doc) && Boolean(url)

  return (
    <button
      type="button"
      onClick={() => {
        if (canPreview) {
          const event = new CustomEvent('candidate-doc-preview', {
            detail: {
              url,
              label: doc.documentLabel || doc.fileName || 'Uploaded document'
            }
          })
          window.dispatchEvent(event)
          return
        }

        window.open(url, '_blank', 'noopener,noreferrer')
      }}
      className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-indigo-200 hover:bg-indigo-50"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200">
        {isImageDocument(doc) && url ? (
          <img src={url} alt={doc.documentLabel || doc.fileName || 'Uploaded document'} className="h-full w-full object-cover" />
        ) : (
          <FileImage className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-slate-900">{doc.documentLabel || 'Document'}</p>
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" />
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-600">{doc.fileName || 'Uploaded image'}</p>
        {uploadedAt ? <p className="mt-1 text-xs text-slate-500">Uploaded {uploadedAt}</p> : null}
      </div>
    </button>
  )
}

function DocumentTypeCard({ item, docs = [], label }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-5 text-slate-900">{label || item.label}</p>
        {item.description ? <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">{item.description}</p> : null}
        <p className={`mt-0.5 text-xs font-semibold ${docs.length ? 'text-emerald-700' : 'text-amber-700'}`}>
          {docs.length ? `${docs.length} file${docs.length === 1 ? '' : 's'} uploaded` : 'Not provided'}
        </p>
      </div>
      {docs.length ? (
        <div className="mt-2 space-y-1.5">
          {docs.map((doc, index) => (
            <DocumentCard key={doc._id || `${doc.fileUrl}-${index}`} doc={doc} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RatingGrid({ title, fields, ratings, onEditHint }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">Rate following parameters: 1 lowest and 5 highest</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">Sr.</th>
              <th className="min-w-56 px-4 py-3">Parameters</th>
              {RATING_VALUES.map((value) => (
                <th key={value} className="w-16 px-4 py-3 text-center">
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field, index) => {
              const selected = ratings?.[field.key] || []
              return (
                <tr key={field.key} className="odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{field.label}</td>
                  {RATING_VALUES.map((value) => (
                    <td key={value} className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`${title}-${field.key}`}
                        checked={selected.some((item) => Number(item) === value)}
                        readOnly
                        onClick={onEditHint}
                        className="h-4 w-4 border-slate-300 text-indigo-600"
                        aria-label={`${field.label} ${value}`}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AssessmentView({ title, fields, assessment, onEditHint }) {
  const counselingYes = (assessment?.counselingOfCandidate || []).some((item) => String(item) === 'Yes')

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">Class and priority use Low / Medium / High. Counseling uses Yes / No and Online / Offline.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-white text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="w-14 px-4 py-3">Sr.</th>
              <th className="min-w-56 px-4 py-3">Questions</th>
              {DIRECTOR_RATING_VALUES.map((value) => (
                <th key={value} className="w-24 px-4 py-3 text-center">
                  {value}
                </th>
              ))}
              {DIRECTOR_YES_NO_VALUES.map((value) => (
                <th key={value} className="w-20 px-4 py-3 text-center">
                  {value}
                </th>
              ))}
              {DIRECTOR_MODE_VALUES.map((value) => (
                <th key={value} className="w-24 px-4 py-3 text-center">
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field, index) => {
              const selected = assessment?.[field.key] || []
              return (
                <tr key={field.key} className="odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{field.label}</td>
                  {DIRECTOR_RATING_VALUES.map((value) => (
                    <td key={value} className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`${title}-${field.key}`}
                        checked={selected.some((item) => String(item) === value)}
                        readOnly
                        onClick={onEditHint}
                        className="h-4 w-4 border-slate-300 text-indigo-600"
                        aria-label={`${field.label} ${value}`}
                      />
                    </td>
                  ))}
                  <td colSpan={4} className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                    -
                  </td>
                </tr>
              )
            })}
            <tr className="odd:bg-white even:bg-slate-50">
              <td className="px-4 py-3 text-slate-500">3</td>
              <td className="px-4 py-3 font-semibold text-slate-800">Counseling Of Candidate</td>
              <td colSpan={3} className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                -
              </td>
              {DIRECTOR_YES_NO_VALUES.map((value) => (
                <td key={value} className="px-4 py-3 text-center">
                  <input
                    type="radio"
                    name={`${title}-counseling`}
                    checked={(assessment?.counselingOfCandidate || []).some((item) => String(item) === value)}
                    readOnly
                    onClick={onEditHint}
                    className="h-4 w-4 border-slate-300 text-indigo-600"
                    aria-label={`Counseling Of Candidate ${value}`}
                  />
                </td>
              ))}
              {counselingYes ? (
                DIRECTOR_MODE_VALUES.map((value) => (
                  <td key={value} className="px-4 py-3 text-center">
                    <input
                      type="radio"
                      name={`${title}-counseling-mode`}
                      checked={(assessment?.counselingMode || []).some((item) => String(item) === value)}
                      readOnly
                      onClick={onEditHint}
                      className="h-4 w-4 border-slate-300 text-indigo-600"
                      aria-label={`Counseling Mode ${value}`}
                    />
                  </td>
                ))
              ) : (
                <td colSpan={2} className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                  -
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InterviewQuestionsView({ questions, onEditHint }) {
  const result = calculateQuestionMarksResult(questions)

  return (
    <div className="rounded-xl border-2 border-slate-900 bg-white p-4 sm:p-6">
      <div className="text-center">
        <span className="inline-flex bg-slate-950 px-2 py-1 text-base font-bold text-white sm:text-lg">Interview Questions and Answers</span>
      </div>

      <div className="mt-6 space-y-3">
        {(questions || []).map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[44px_minmax(0,1fr)_140px] md:items-center">
            <div className="text-sm font-bold text-slate-950 sm:text-base">{index + 1}.</div>
            <input
              value={fieldValue(row.question)}
              readOnly
              onClick={onEditHint}
              className="h-10 min-w-0 cursor-pointer border-0 border-b-2 border-slate-900 bg-transparent px-1 text-sm font-semibold text-slate-900 outline-none"
              aria-label={`Interview question ${index + 1}`}
            />
            <button
              type="button"
              onClick={onEditHint}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900"
              aria-label={`Question ${index + 1} marks`}
            >
              <span>{fieldValue(row.marks)}</span>
              <span className="text-slate-500">/10</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <div className="inline-flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-900">
          <span>Total Marks</span>
          <span className="text-indigo-700">{result.total}/{result.maxTotal}</span>
          <span className="text-emerald-700">{result.percentageLabel}</span>
        </div>
      </div>
    </div>
  )
}

const interviewDetailFields = [
  ['candidateName', 'Name Of Candidate'],
  ['companyName', 'Name Of Company'],
  ['jobRole', 'Job Role/Department'],
  ['referencePerson', 'Reference'],
  ['attendInterview', 'Attend Interview'],
  ['interestedForJoin', 'Interested For Join'],
  ['date', 'Date Of Interview'],
  ['selectionChances', 'Selection Chances'],
  ['ratingForCompany', 'Rating For Company'],
  ['notAttendRemark', 'Not Attend Remark'],
  ['notInterestedReason', 'IF Not Interested Reason'],
  ['replyFromCompany', 'Reply From Company'],
  ['positiveFeedback', 'Positive Feedback'],
  ['negativeFeedback', 'Negative Feedback'],
  ['overallDiscussion', 'Overall Discussion'],
  ['note', 'Note'],
  ['updatedBy', 'Update By']
]

function InterviewDetailsPanel({ row, candidateName, onClose }) {
  if (!row) return null

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-950">Interview Details</h3>
          <p className="mt-1 text-sm text-slate-500">{row.companyName || 'Company'} interview update</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
          aria-label="Close interview details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {interviewDetailFields.map(([key, label]) => {
          const rawValue = key === 'candidateName' ? row.candidateName || candidateName : row[key]
          const value = key === 'ratingForCompany' && rawValue !== '' && rawValue !== undefined ? `${rawValue}/5` : rawValue
          return (
            <div key={key} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">{value || '-'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CandidateDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [activePanel, setActivePanel] = useState(() => panelFromSearch(searchParams))
  const [candidate, setCandidate] = useState(null)
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [deletingInterview, setDeletingInterview] = useState(null)
  const [documentInterviewId, setDocumentInterviewId] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const viewOnly = searchParams.get('viewOnly') === '1'

  useEffect(() => {
    setActivePanel(panelFromSearch(searchParams))
  }, [searchParams])

  const showEditHint = () => {
    toast(viewOnly ? 'View mode only.' : 'View mode only. Click Update to edit this candidate.', {
      id: 'candidate-view-edit-hint',
      icon: '!'
    })
  }

  const goToEdit = () => {
    const panel = editablePanels.has(activePanel) ? activePanel : 'details'
    navigate(`/admin/cms/candidates/${id}/edit?panel=${panel}`)
  }

  const handleDeleteInterview = async () => {
    if (!deletingInterview?.id) return

    try {
      await api.delete(`/cms/interviews/${deletingInterview.id}`)
      setCandidate((current) =>
        current
          ? {
              ...current,
              interviews: (current.interviews || []).filter((row) => String(row.id) !== String(deletingInterview.id))
            }
          : current
      )
      if (String(selectedInterview?.id || '') === String(deletingInterview.id)) {
        setSelectedInterview(null)
      }
      if (String(documentInterviewId || '') === String(deletingInterview.id)) {
        setDocumentInterviewId('')
      }
      toast.success('Interview deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete interview')
    } finally {
      setDeletingInterview(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/cms/candidates/${id}`)
        setCandidate(mapApiToCandidateForm(data))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Candidate not found')
        navigate('/admin/cms/candidates')
      }
    }

    load()
  }, [id, navigate])

  useEffect(() => {
    const handlePreview = (event) => {
      setPreviewDoc(event.detail || null)
    }

    window.addEventListener('candidate-doc-preview', handlePreview)
    return () => window.removeEventListener('candidate-doc-preview', handlePreview)
  }, [])

  const visibleInterviews = useMemo(() => (candidate?.interviews || []).filter(interviewHasContent), [candidate])

  if (!candidate) return <div className={cardClass}>Loading candidate...</div>

  const candidateDocumentsByType = groupCandidateDocumentsByType(candidate.documents)
  const extraCandidateDocuments = unmatchedCandidateDocuments(candidate.documents)
  const selectedDocumentInterview = visibleInterviews.find((row) => String(row.id) === String(documentInterviewId)) || visibleInterviews[0] || null
  const selectedInterviewDocumentsByType = groupInterviewDocumentsByType(selectedDocumentInterview?.documents)

  return (
    <div className="flex min-h-0 flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/cms/candidates')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{candidate.fullName}</h1>
          {candidate.candidateCode ? <p className="text-sm font-semibold text-slate-500">{candidate.candidateCode}</p> : null}
        </div>
        {!viewOnly ? (
          <button
            type="button"
            onClick={goToEdit}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
          >
            <Pencil className="h-4 w-4" />
            Update
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activePanel === 'details'} label="Candidate Details" onClick={() => setActivePanel('details')} />
        <TabButton active={activePanel === 'documents'} label="Documents" onClick={() => setActivePanel('documents')} />
        <TabButton active={activePanel === 'successInfo'} label="Success Info For Candidate" onClick={() => setActivePanel('successInfo')} />
        <TabButton active={activePanel === 'assessment'} label="Success Interviewer Remark" onClick={() => setActivePanel('assessment')} />
        <TabButton active={activePanel === 'interviews'} label="Company Interviews" onClick={() => setActivePanel('interviews')} />
      </div>

      {activePanel === 'details' ? (
        <>
          <Section title="Personal Details" icon={UserRound}>
            <FieldGroup title="All Details" icon={UserRound}>
              <Field label="Candidate Name">
                <ReadOnlyInput value={candidate.fullName} onEditHint={showEditHint} />
              </Field>
              <Field label="Mobile No">
                <ReadOnlyInput value={candidate.mobile} onEditHint={showEditHint} />
              </Field>
              <Field label="WhatsApp No">
                <ReadOnlyInput value={candidate.whatsappNo} onEditHint={showEditHint} />
              </Field>
              <Field label="Email ID">
                <ReadOnlyInput type="email" value={candidate.email} onEditHint={showEditHint} />
              </Field>
              <Field label="Aadhar Card Number">
                <ReadOnlyInput value={candidate.aadhaarNo} onEditHint={showEditHint} />
              </Field>
              <Field label="PAN Number">
                <ReadOnlyInput value={candidate.panNo} onEditHint={showEditHint} />
              </Field>
              <Field label="DOB">
                <ReadOnlyInput type="date" value={candidate.dateOfBirth} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Age">
                <ReadOnlyInput type="number" value={candidate.currentAge} onEditHint={showEditHint} />
              </Field>
              <Field label="Gender">
                <ReadOnlyInput value={candidate.gender} onEditHint={showEditHint} />
              </Field>
              <Field label="Marital Status">
                <ReadOnlyInput value={candidate.marriageStatus} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Village">
                <ReadOnlyInput value={candidate.currentAddressVillage} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Taluka">
                <ReadOnlyInput value={candidate.currentAddressTaluka} onEditHint={showEditHint} />
              </Field>
              <Field label="Current District">
                <ReadOnlyInput value={candidate.currentAddressDistrict} onEditHint={showEditHint} />
              </Field>
              <Field label="Current State">
                <ReadOnlyInput value={candidate.currentAddressState} onEditHint={showEditHint} />
              </Field>
              <Field label="Permanent Village">
                <ReadOnlyInput value={candidate.permanentAddressVillage} onEditHint={showEditHint} />
              </Field>
              <Field label="Permanent Taluka">
                <ReadOnlyInput value={candidate.permanentAddressTaluka} onEditHint={showEditHint} />
              </Field>
              <Field label="Permanent District">
                <ReadOnlyInput value={candidate.permanentAddressDistrict} onEditHint={showEditHint} />
              </Field>
              <Field label="Permanent State">
                <ReadOnlyInput value={candidate.permanentAddressState} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Family Details" icon={Users}>
              <Field label="Father / Husband Name">
                <ReadOnlyInput value={candidate.familyDetails.fatherOrHusbandName} onEditHint={showEditHint} />
              </Field>
              <Field label="Father Occupation">
                <ReadOnlyInput value={candidate.familyDetails.fatherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Father Mobile Number">
                <ReadOnlyInput value={candidate.familyDetails.fatherMobileNumber} onEditHint={showEditHint} />
              </Field>
              <Field label="Mother / Wife Name">
                <ReadOnlyInput value={candidate.familyDetails.motherOrWifeName} onEditHint={showEditHint} />
              </Field>
              <Field label="Mother Occupation">
                <ReadOnlyInput value={candidate.familyDetails.motherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Mother Mobile Number">
                <ReadOnlyInput value={candidate.familyDetails.motherMobileNumber} onEditHint={showEditHint} />
              </Field>
              <Field label="Sibling Name">
                <ReadOnlyInput value={candidate.familyDetails.siblingName} onEditHint={showEditHint} />
              </Field>
              <Field label="Sibling Education / Occupation">
                <ReadOnlyInput value={candidate.familyDetails.siblingEducationOccupation} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>
          </Section>

          <Section title="Education Details" icon={ClipboardList}>
            <FieldGroup title="Education">
              <Field label="Highest Education">
                <ReadOnlyInput value={candidate.educationSector} onEditHint={showEditHint} />
              </Field>
              <Field label="Year of Higher Education">
                <ReadOnlyInput value={candidate.yearOfHigherEducation} onEditHint={showEditHint} />
              </Field>
              <Field label="Education Branch">
                <ReadOnlyInput value={candidate.educationBranch} onEditHint={showEditHint} />
              </Field>
              <Field label="Special Subject / Remark">
                <ReadOnlyInput value={candidate.educationSpecialization} onEditHint={showEditHint} />
              </Field>
              <Field label="Computer Courses">
                <ReadOnlyInput value={candidate.computerCourse} onEditHint={showEditHint} />
              </Field>
              <Field label="Other Certification Courses">
                <ReadOnlyInput value={candidate.certificationCourse} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Institute Reference Details">
              <Field label="Institute Name">
                <ReadOnlyInput value={candidate.collegeName} onEditHint={showEditHint} />
              </Field>
              <Field label="Institute Representative Name">
                <ReadOnlyInput value={candidate.placementReference.professorName} onEditHint={showEditHint} />
              </Field>
              <Field label="Designation">
                <ReadOnlyInput value={candidate.instituteDesignation} onEditHint={showEditHint} />
              </Field>
              <Field label="Mobile Number">
                <ReadOnlyInput value={candidate.placementReference.professorContactNumber} onEditHint={showEditHint} />
              </Field>
              <Field label="Institute Village">
                <ReadOnlyInput value={candidate.instituteAddressVillage} onEditHint={showEditHint} />
              </Field>
              <Field label="Institute Taluka">
                <ReadOnlyInput value={candidate.instituteAddressTaluka} onEditHint={showEditHint} />
              </Field>
              <Field label="Institute District">
                <ReadOnlyInput value={candidate.instituteAddressDistrict} onEditHint={showEditHint} />
              </Field>
              <Field label="Institute State">
                <ReadOnlyInput value={candidate.instituteAddressState} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Institute / College Details">
              <Field label="12th / Graduate College Name">
                <ReadOnlyInput value={candidate.college12GraduateName} onEditHint={showEditHint} />
              </Field>
              <Field label="Post Graduate College Name">
                <ReadOnlyInput value={candidate.postGraduateCollegeName} onEditHint={showEditHint} />
              </Field>
              <Field label="Teacher">
                <ReadOnlyInput value={candidate.collegeTeacherName} onEditHint={showEditHint} />
              </Field>
              <Field label="Designation">
                <ReadOnlyInput value={candidate.collegeDesignation} onEditHint={showEditHint} />
              </Field>
              <Field label="Mobile Number">
                <ReadOnlyInput value={candidate.collegeMobileNumber} onEditHint={showEditHint} />
              </Field>
              <Field label="Reference">
                <ReadOnlyInput value={candidate.collegeReference} onEditHint={showEditHint} />
              </Field>
              <Field label="College Village">
                <ReadOnlyInput value={candidate.collegeAddressVillage} onEditHint={showEditHint} />
              </Field>
              <Field label="College Taluka">
                <ReadOnlyInput value={candidate.collegeAddressTaluka} onEditHint={showEditHint} />
              </Field>
              <Field label="College District">
                <ReadOnlyInput value={candidate.collegeAddressDistrict} onEditHint={showEditHint} />
              </Field>
              <Field label="College State">
                <ReadOnlyInput value={candidate.collegeAddressState} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>
          </Section>

          <Section title="Professional Details" icon={BriefcaseBusiness}>
            <FieldGroup title="Job Preference" icon={MapPin}>
              <Field label="Preferred Department">
                <ReadOnlyInput value={candidate.interestedDepartment} onEditHint={showEditHint} />
              </Field>
              <Field label="Preferred Industry">
                <ReadOnlyInput value={candidate.preferredIndustry} onEditHint={showEditHint} />
              </Field>
              <Field label="Industry Specialization">
                <ReadOnlyInput value={candidate.industrySpecialization} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Current Salary Per Month">
              <Field label="NET / In-hand Salary">
                <ReadOnlyInput value={candidate.netInHandSalary} onEditHint={showEditHint} />
              </Field>
              <Field label="Gross Per Month">
                <ReadOnlyInput value={candidate.grossSalaryPerMonth} onEditHint={showEditHint} />
              </Field>
              <Field label="CTC Per Month">
                <ReadOnlyInput value={candidate.ctcSalaryPerMonth} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Job Location">
                <ReadOnlyInput value={candidate.currentJobLocation} onEditHint={showEditHint} />
              </Field>
              <Field label="Preferred Job Location">
                <ReadOnlyInput value={candidate.preferredJobLocation} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Expected Salary Per Month">
              <Field label="Expected NET / In-hand Salary">
                <ReadOnlyInput value={candidate.expectedNetInHandSalary} onEditHint={showEditHint} />
              </Field>
              <Field label="Expected Gross Per Month">
                <ReadOnlyInput value={candidate.expectedGrossSalaryPerMonth} onEditHint={showEditHint} />
              </Field>
              <Field label="Expected CTC Per Month">
                <ReadOnlyInput value={candidate.expectedCtcSalaryPerMonth} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Job Working Status">
              <Field label="Job Working Status">
                <ReadOnlyInput value={candidate.jobWorkingStatus} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Total Years of Experience">
              <Field label="Total Year of Experience">
                <ReadOnlyInput value={candidate.experienceType} onEditHint={showEditHint} />
              </Field>
              <Field label="Enter Experience">
                <ReadOnlyInput value={candidate.totalExperience} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Notice Period">
              <Field label="Notice Period">
                <ReadOnlyInput value={candidate.noticePeriod} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Reason For Job Change">
              <Field label="Reason For Job Change">
                <ReadOnlyInput value={candidate.reasonForJobChange} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Key Skills / Knowledge">
              <Field label="Key Skills / Knowledge">
                <ReadOnlyInput value={candidate.keySkillsKnowledge} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Key Job Responsibility">
              <Field label="Key Job Responsibility">
                <ReadOnlyInput value={candidate.careerJobResponsibilities} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>
          </Section>

          <Section title="Reference Success Details" icon={Users}>
            <FieldGroup title="Reference Details">
              <Field label="Business Advisor Code">
                <ReadOnlyInput value={candidate.advisorCode} onEditHint={showEditHint} />
              </Field>
              <Field label="Reference Name">
                <ReadOnlyInput value={candidate.placementReference.referenceBy} onEditHint={showEditHint} />
              </Field>
              <Field label="Reference Mobile Number">
                <ReadOnlyInput value={candidate.placementReference.referenceContactNumber} onEditHint={showEditHint} />
              </Field>
              <Field label="Reference Profile">
                <ReadOnlyInput value={candidate.referenceProfile} onEditHint={showEditHint} />
              </Field>
              <Field label="Reference Source" className="md:col-span-2 xl:col-span-3">
                <ReadOnlyInput value={(candidate.referenceSources || []).join(', ')} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>
          </Section>
        </>
      ) : null}

      {activePanel === 'documents' ? (
        <>
          <Section title="Candidate Documents" icon={Upload}>
            <p className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              JPG/PNG images and PDF letters where applicable. Max 10MB each.
            </p>
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {candidateDocumentTypes.map((item) => (
                <DocumentTypeCard key={item.key} item={item} docs={candidateDocumentsByType[item.key] || []} />
              ))}
            </div>
            {extraCandidateDocuments.length ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-slate-500">Other Uploaded Documents</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {extraCandidateDocuments.map((doc, index) => (
                    <DocumentCard key={doc._id || `${doc.fileUrl}-${index}`} doc={doc} />
                  ))}
                </div>
              </div>
            ) : null}
          </Section>

          <Section title="Success Documents" icon={Upload}>
            <p className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Success and joining documents. Videos are shown where applicable.
            </p>
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {successDocumentTypes.map((item) => (
                <DocumentTypeCard key={item.key} item={item} docs={candidateDocumentsByType[item.key] || []} />
              ))}
            </div>
          </Section>

          <Section title="Interview Documents" icon={Upload}>
            {visibleInterviews.length ? (
              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-500">Select Interview</p>
                  <div className="space-y-2">
                    {visibleInterviews.map((row) => {
                      const active = String(selectedDocumentInterview?.id || '') === String(row.id)
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => setDocumentInterviewId(row.id)}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            active ? 'border-indigo-300 bg-white text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          <p className="truncate text-sm font-bold">{row.companyName || 'Company interview'}</p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{row.jobRole || row.date || 'No job role/department added'}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Interview Documents</h4>
                    <p className="text-xs font-semibold text-slate-500">Appointment, offer, interview, and confirmation letters.</p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    {interviewDocumentTypes.map((item) => (
                      <DocumentTypeCard key={item.key} item={item} docs={selectedInterviewDocumentsByType[item.key] || []} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">No company interview added yet.</p>
            )}
          </Section>
        </>
      ) : null}

      {activePanel === 'successInfo' ? (
        <Section title="Success Info For Candidate" icon={ClipboardList}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SUCCESS_INFO_FIELDS.map((field) => {
              const multiline = ['candidateDataSource', 'hrContactDetails'].includes(field.key)

              return (
                <Field key={field.key} label={field.label} className={multiline ? 'xl:col-span-3' : ''}>
                  {multiline ? (
                    <ReadOnlyTextArea rows={3} value={candidate.successInfo?.[field.key]} onEditHint={showEditHint} />
                  ) : (
                    <ReadOnlyInput value={candidate.successInfo?.[field.key]} onEditHint={showEditHint} />
                  )}
                </Field>
              )
            })}
          </div>
        </Section>
      ) : null}

      {activePanel === 'assessment' ? (
        <Section title="Success Interviewer Remark">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Candidate Name</p>
            <p className="mt-1 text-base font-bold text-slate-950">{candidate.fullName || '-'}</p>
          </div>

          <AssessmentView title="Director Assessment" fields={DIRECTOR_ASSESSMENT_FIELDS} assessment={candidate.interviewForm.directorAssessment} onEditHint={showEditHint} />
          <AssessmentView title="Manager Assessment" fields={MANAGER_ASSESSMENT_FIELDS} assessment={candidate.interviewForm.managerAssessment} onEditHint={showEditHint} />

          <div className="grid gap-4 xl:grid-cols-2">
            <RatingGrid title="Professional Assessment" fields={PROFESSIONAL_RATING_FIELDS} ratings={candidate.interviewForm.professionalRatings} onEditHint={showEditHint} />
            <RatingGrid title="Personality Assessment" fields={PERSONALITY_RATING_FIELDS} ratings={candidate.interviewForm.personalityRatings} onEditHint={showEditHint} />
          </div>

          <FieldGroup title="Success Interviewer Remark">
            <Field label="Suitable Industry">
              <ReadOnlyInput value={candidate.interviewForm.suitableIndustry} onEditHint={showEditHint} />
            </Field>
            <Field label="Suitable Department">
              <ReadOnlyInput value={candidate.interviewForm.suitableDepartment} onEditHint={showEditHint} />
            </Field>
            <Field label="HR Interviewer">
              <ReadOnlyInput value={candidate.interviewForm.hrInterviewer} onEditHint={showEditHint} />
            </Field>
            <Field label="Remark">
              <ReadOnlyInput value={candidate.interviewForm.remark} onEditHint={showEditHint} />
            </Field>
          </FieldGroup>

          <InterviewQuestionsView questions={candidate.interviewForm.questions} onEditHint={showEditHint} />
        </Section>
      ) : null}

      {activePanel === 'interviews' ? (
        <Section title="Company Interviews">
          <p className="text-sm font-semibold text-slate-500">Company-wise interview updates are listed by date. Open View for details or Update to edit.</p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-14 px-4 py-3">#</th>
                    <th className="px-4 py-3">Company Name</th>
                    <th className="w-40 px-4 py-3">Job Role/Department</th>
                    <th className="w-36 px-4 py-3">Interview Date</th>
                    <th className="w-36 px-4 py-3">Selection Chances</th>
                    <th className="w-72 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleInterviews.map((row, index) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.companyName || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{row.jobRole || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{row.date || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{row.selectionChances || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInterview(row)}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/cms/candidates/${id}/edit?panel=interviews&interview=${row.id}`)}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            <Pencil className="h-4 w-4" />
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingInterview(row)}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No interview updates added yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          <InterviewDetailsPanel row={selectedInterview} candidateName={candidate.fullName} onClose={() => setSelectedInterview(null)} />
        </Section>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingInterview)}
        title="Delete Interview"
        message={`Delete ${deletingInterview?.companyName || 'this interview'}?`}
        confirmText="Delete"
        danger
        onCancel={() => setDeletingInterview(null)}
        onConfirm={handleDeleteInterview}
      />

      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="truncate text-sm font-bold text-slate-900">{previewDoc.label}</p>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-slate-100 p-3">
              <img src={previewDoc.url} alt={previewDoc.label} className="mx-auto h-auto max-h-[75vh] w-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
