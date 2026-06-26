import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, BriefcaseBusiness, ClipboardList, Download, ExternalLink, Eye, FileImage, MapPin, Pencil, Search, Trash2, Upload, UserRound, Users, X } from 'lucide-react'
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
  WITNESS_FIELDS,
  calculateQuestionMarksResult,
  candidateVisitHasContent,
  interviewHasContent,
  mapApiToCandidateForm,
  normalizedCollegeReferenceRows
} from './candidateFormModel'
import {
  createCandidateExcelWorkbook,
  createCompanyInterviewPdf,
  createSuccessInfoPdf,
  downloadBlob,
  safeFileName
} from './AddCandidate'

const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none'
const textAreaClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none'
const labelClass = 'text-sm font-semibold text-slate-700'
const cardClass = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5'
const directorAssessmentLabel = 'MR Ganesh Avhad - Director Assessment'

const dateLabel = (value) => (value ? String(value).slice(0, 10) : '')
const fieldValue = (value) => (value === null || value === undefined ? '' : String(value))
const siblingHasValue = (sibling = {}) =>
  Object.values(sibling).some((value) => String(value ?? '').trim())
const siblingRows = (familyDetails = {}) => {
  const rows = Array.isArray(familyDetails.siblings) && familyDetails.siblings.length
    ? familyDetails.siblings
    : [{
        siblingName: familyDetails.siblingName,
        siblingEducation: familyDetails.siblingEducation || familyDetails.siblingEducationOccupation,
        siblingMobileNumber: familyDetails.siblingMobileNumber,
        siblingDateOfBirth: familyDetails.siblingDateOfBirth,
        siblingAge: familyDetails.siblingAge,
        siblingGender: familyDetails.siblingGender,
        siblingCareerProfile: familyDetails.siblingCareerProfile,
        siblingStudyStandard: familyDetails.siblingStudyStandard,
        siblingStudyStandardOther: familyDetails.siblingStudyStandardOther,
        siblingCareerProfileOther: familyDetails.siblingCareerProfileOther
      }]

  return rows.filter(siblingHasValue)
}
const collegeReferenceRows = (candidate = {}) =>
  normalizedCollegeReferenceRows(candidate.collegeReferences).filter((reference) =>
    Object.values(reference).some((value) => String(value ?? '').trim())
  )
const editablePanels = new Set(['details', 'documents', 'successInfo', 'assessment', 'interviews', 'visits'])
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
    othercertificationcertificate: 'otherCertificationCertificate',
    othercertificationcoursecertificate: 'otherCertificationCertificate',
    certificationcoursecertificate: 'otherCertificationCertificate',
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

const normalizeGlobalSearch = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const globalFieldKey = (panel, key) => `view-global-${panel}-${normalizeDocToken(key) || 'field'}`

const pathValue = (source, path) => {
  if (!path) return ''
  return path.split('.').reduce((acc, key) => (acc == null ? '' : acc[key]), source) ?? ''
}

const compactSearchValue = (value) => {
  if (Array.isArray(value)) return value.map(compactSearchValue).filter(Boolean).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(compactSearchValue).filter(Boolean).join(' ')
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

const previewSearchValue = (value) => {
  const compact = compactSearchValue(value)
  return compact.length > 96 ? `${compact.slice(0, 93)}...` : compact
}

const scrollToGlobalField = (targetKey) => {
  window.setTimeout(() => {
    const target = document.querySelector(`[data-global-field="${targetKey}"]`)
    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const previousBoxShadow = target.style.boxShadow
    const previousBackground = target.style.backgroundColor
    const previousTransition = target.style.transition
    target.style.transition = 'box-shadow 160ms ease, background-color 160ms ease'
    target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.28)'
    target.style.backgroundColor = 'rgba(238, 242, 255, 0.72)'

    const focusable = target.querySelector?.('input, textarea, button, select')
    focusable?.focus?.({ preventScroll: true })

    window.setTimeout(() => {
      target.style.boxShadow = previousBoxShadow
      target.style.backgroundColor = previousBackground
      target.style.transition = previousTransition
    }, 1700)
  }, 90)
}

const detailSearchFields = [
  ['Candidate Name', 'fullName'],
  ['Mobile No', 'mobile'],
  ['WhatsApp No', 'whatsappNo'],
  ['Email ID', 'email'],
  ['Aadhar Card Number', 'aadhaarNo'],
  ['PAN Number', 'panNo'],
  ['DOB', 'dateOfBirth'],
  ['Current Age', 'currentAge'],
  ['Gender', 'gender'],
  ['Marital Status', 'marriageStatus'],
  ['Current Flat No / House No, Society, Landmark', 'currentAddressLine'],
  ['Current Village', 'currentAddressVillage'],
  ['Current Taluka', 'currentAddressTaluka'],
  ['Current District', 'currentAddressDistrict'],
  ['Current State', 'currentAddressState'],
  ['Permanent Flat No / House No, Society, Landmark', 'permanentAddressLine'],
  ['Permanent Village', 'permanentAddressVillage'],
  ['Permanent Taluka', 'permanentAddressTaluka'],
  ['Permanent District', 'permanentAddressDistrict'],
  ['Permanent State', 'permanentAddressState'],
  ['Father / Husband Name', 'familyDetails.fatherOrHusbandName'],
  ['Father / Husband Occupation', 'familyDetails.fatherOccupation'],
  ['Father / Husband Mobile Number', 'familyDetails.fatherMobileNumber'],
  ['Mother / Wife Name', 'familyDetails.motherOrWifeName'],
  ['Mother / Wife Occupation', 'familyDetails.motherOccupation'],
  ['Mother / Wife Mobile Number', 'familyDetails.motherMobileNumber'],
  ['Sibling / Brother / Sister Name', 'familyDetails.siblingName'],
  ['Sibling / Brother / Sister Education', 'familyDetails.siblingEducation'],
  ['Sibling / Brother / Sister Mobile Number', 'familyDetails.siblingMobileNumber'],
  ['Sibling / Brother / Sister DOB', 'familyDetails.siblingDateOfBirth'],
  ['Sibling / Brother / Sister Age', 'familyDetails.siblingAge'],
  ['Sibling / Brother / Sister Gender', 'familyDetails.siblingGender'],
  ['Sibling / Brother / Sister Career Profile', 'familyDetails.siblingCareerProfile'],
  ['Sibling / Brother / Sister Study Standard', 'familyDetails.siblingStudyStandard'],
  ['Other Sibling / Brother / Sister Study Standard', 'familyDetails.siblingStudyStandardOther'],
  ['Other Sibling / Brother / Sister Career Profile', 'familyDetails.siblingCareerProfileOther'],
  ['Highest Education Like Graduate, Post Graduate', 'educationSector'],
  ['Passing Year of Education', 'yearOfHigherEducation'],
  ['Education Branch', 'educationBranch'],
  ['Mention Your Other Branch', 'educationBranchOther'],
  ['Special Subject / Remark', 'educationSpecialization'],
  ['Other Special Subject / Remark', 'educationSpecializationOther'],
  ['Computer Courses', 'computerCourse'],
  ['English Typing', 'englishTyping'],
  ['Hindi Typing', 'hindiTyping'],
  ['Other Certification Courses', 'certificationCourse'],
  ['College Name', 'collegeName'],
  ['College Education Branch', 'collegeEducationBranch'],
  ['Other College Education Branch', 'collegeEducationBranchOther'],
  ['College Representative Name', 'placementReference.professorName'],
  ['Designation', 'instituteDesignation'],
  ['Other Designation', 'instituteDesignationOther'],
  ['Mobile Number', 'placementReference.professorContactNumber'],
  ['Post Graduate College Name', 'postGraduateReference.instituteName'],
  ['Post Graduate College Education Branch', 'postGraduateReference.educationBranch'],
  ['Post Graduate Other College Education Branch', 'postGraduateReference.educationBranchOther'],
  ['Post Graduate College Representative Name', 'postGraduateReference.representativeName'],
  ['Post Graduate Designation', 'postGraduateReference.designation'],
  ['Post Graduate Other Designation', 'postGraduateReference.designationOther'],
  ['Post Graduate Mobile Number', 'postGraduateReference.mobileNumber'],
  ['College Village', 'instituteAddressVillage'],
  ['College Taluka', 'instituteAddressTaluka'],
  ['College District', 'instituteAddressDistrict'],
  ['College State', 'instituteAddressState'],
  ['Institute Representative Name', 'collegeTeacherName'],
  ['Course Branch', 'collegeCourseBranch'],
  ['Other Course Branch', 'collegeCourseBranchOther'],
  ['Designation', 'collegeDesignation'],
  ['Mobile Number', 'collegeMobileNumber'],
  ['Reference', 'collegeReference'],
  ['Preferred Department', 'interestedDepartment'],
  ['Preferred Industry', 'preferredIndustry'],
  ['Industry Specialization', 'industrySpecialization'],
  ['Expected NET / In-hand Salary', 'expectedNetInHandSalary'],
  ['Expected Gross Per Month', 'expectedGrossSalaryPerMonth'],
  ['Expected CTC Per Month', 'expectedCtcSalaryPerMonth'],
  ['Expected Salary Negotiable', 'expectedSalaryNegotiable'],
  ['NET / In-hand Salary', 'netInHandSalary'],
  ['Gross Per Month', 'grossSalaryPerMonth'],
  ['CTC Per Month', 'ctcSalaryPerMonth'],
  ['Current Job Location (Taluka)', 'currentJobLocation'],
  ['Other Current Job Location (Taluka)', 'currentJobLocationOther'],
  ['Current Job Location (MIDC Area)', 'currentJobLocationMidcArea'],
  ['Other MIDC Area', 'currentJobLocationMidcAreaOther'],
  ['Preferred Job Location', 'preferredJobLocation'],
  ['Job Working Status', 'jobWorkingStatus'],
  ['Total Year of Experience', 'experienceType'],
  ['Enter Total Year of Experience', 'totalExperience'],
  ['Notice Period', 'noticePeriod'],
  ['Availability for Interview', 'availabilityForInterview'],
  ['Interview Mode', 'interviewMode'],
  ['Online Interview Mode', 'onlineInterviewMode'],
  ['Reason For Job Change', 'reasonForJobChange'],
  ['Key Skills You Have', 'keySkillsKnowledge'],
  ['Responsibility Type', 'careerResponsibilityRole'],
  ['Other Responsibility Type', 'careerResponsibilityRoleOther'],
  ['Key Job Responsibility As Per Your Experience', 'careerJobResponsibilities'],
  ['Business Advisor Code', 'advisorCode'],
  ['Reference Name', 'placementReference.referenceBy'],
  ['Reference Mobile Number', 'placementReference.referenceContactNumber'],
  ['Reference Profile', 'referenceProfile'],
  ['Reference Relation', 'referenceRelation'],
  ['Other Reference Relation', 'referenceRelationOther'],
  ['Reference Source', 'referenceSources'],
  ['Other Reference Source', 'referenceSourceOther']
]

function CandidateGlobalSearch({ value, results, onChange, onSelect }) {
  const [open, setOpen] = useState(false)
  const showResults = open && value.trim()

  return (
    <div
      className="relative w-full max-w-3xl"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        placeholder="Search any field, value, document, or interview..."
        className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
      {value ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange('')
            setOpen(false)
          }}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Clear global search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {showResults ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {results.length ? (
            results.map((item) => (
              <button
                key={`${item.panel}-${item.targetKey}-${item.label}-${item.group}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(item)
                  setOpen(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-indigo-50"
              >
                <span className="block text-sm font-bold text-slate-900">{item.label}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                  {item.panelLabel}
                  {item.group ? ` / ${item.group}` : ''}
                </span>
                {item.valueText ? <span className="mt-1 block truncate text-xs font-medium text-slate-400">{item.valueText}</span> : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm font-semibold text-slate-500">No field matched.</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, icon: Icon, children, searchKey = '' }) {
  return (
    <section className={`${cardClass} space-y-5`} data-global-field={searchKey || globalFieldKey('section', title)}>
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

function Field({ label, className = '', children, searchKey = '' }) {
  return (
    <label className={`${labelClass} ${className}`} data-global-field={searchKey || globalFieldKey('field', label)}>
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

function DetailStepTabs({ currentStep, onStep }) {
  return (
    <aside className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
      <nav className="grid gap-1.5 sm:grid-cols-2 xl:flex xl:min-w-0 xl:flex-wrap">
        {viewDetailSteps.map((step, index) => {
          const StepIcon = step.icon
          const active = index === currentStep
          const complete = index < currentStep
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => onStep(index)}
              className={`flex min-h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-left text-xs font-semibold transition xl:min-w-[150px] ${
                active
                  ? 'bg-sky-600 text-white shadow-sm'
                  : complete
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50'
              }`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${active ? 'bg-white/15' : 'bg-white ring-1 ring-slate-200'}`}>
                <StepIcon className="h-3 w-3" />
              </span>
              <span className="min-w-0 flex-1 truncate leading-5">{step.title}</span>
            </button>
          )
        })}
      </nav>
    </aside>
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

function DocumentCard({ doc, searchKey = '' }) {
  const url = assetUrl(doc.fileUrl)
  const uploadedAt = formatDocumentDate(doc.uploadedAt)
  const canPreview = isImageDocument(doc) && Boolean(url)

  return (
    <button
      type="button"
      data-global-field={searchKey || undefined}
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

function DocumentTypeCard({ item, docs = [], label, searchKey = '' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3" data-global-field={searchKey || globalFieldKey('document', item?.key || label)}>
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
                <tr key={field.key} className="odd:bg-white even:bg-slate-50" data-global-field={globalFieldKey('assessment', `${title}-${field.key}`)}>
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
                <tr key={field.key} className="odd:bg-white even:bg-slate-50" data-global-field={globalFieldKey('assessment', `${title}-${field.key}`)}>
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
            <tr className="odd:bg-white even:bg-slate-50" data-global-field={globalFieldKey('assessment', `${title}-counselingOfCandidate`)}>
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
          <div key={index} className="grid gap-2 md:grid-cols-[44px_minmax(0,1fr)_140px] md:items-center" data-global-field={globalFieldKey('question', index + 1)}>
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

const viewPanelLabels = {
  details: 'Candidate Details',
  documents: 'Documents',
  successInfo: 'Success Info For Candidate',
  assessment: 'Success Interviewer Remark',
  interviews: 'Company Interviews',
  visits: 'Number of Visits'
}

const viewDetailSteps = [
  { title: 'Personal Details', icon: UserRound },
  { title: 'Education Details', icon: ClipboardList },
  { title: 'Professional Details', icon: BriefcaseBusiness },
  { title: 'Reference Success Details', icon: Users }
]

const detailStepForPath = (path = '') => {
  const value = String(path || '')
  if (
    value.startsWith('familyDetails.') ||
    [
      'fullName',
      'mobile',
      'whatsappNo',
      'email',
      'aadhaarNo',
      'panNo',
      'dateOfBirth',
      'currentAge',
      'gender',
      'marriageStatus'
    ].includes(value) ||
    value.startsWith('currentAddress') ||
    value.startsWith('permanentAddress')
  ) {
    return 0
  }
  if (
    value.startsWith('education') ||
    value.startsWith('postGraduateReference.') ||
    value.startsWith('instituteAddress') ||
    value.startsWith('college') ||
    value.startsWith('placementReference.professor') ||
    [
      'yearOfHigherEducation',
      'computerCourse',
      'certificationCourse',
      'instituteDesignation'
    ].includes(value)
  ) {
    return 1
  }
  if (
    [
      'interestedDepartment',
      'preferredIndustry',
      'industrySpecialization',
      'expectedNetInHandSalary',
      'expectedGrossSalaryPerMonth',
      'expectedCtcSalaryPerMonth',
      'expectedSalaryNegotiable',
      'netInHandSalary',
      'grossSalaryPerMonth',
      'ctcSalaryPerMonth',
      'currentJobLocation',
      'currentJobLocationOther',
      'currentJobLocationMidcArea',
      'currentJobLocationMidcAreaOther',
      'preferredJobLocation',
      'jobWorkingStatus',
      'experienceType',
      'totalExperience',
      'noticePeriod',
      'availabilityForInterview',
      'interviewMode',
      'onlineInterviewMode',
      'reasonForJobChange',
      'keySkillsKnowledge',
      'careerJobResponsibilities'
    ].includes(value)
  ) {
    return 2
  }
  return 3
}

const createSearchItem = ({ label, panel, group = '', value = '', targetKey = '', interviewId = '', documentInterviewId = '', detailStep = null }) => {
  const valueText = previewSearchValue(value)
  return {
    label,
    panel,
    group,
    valueText,
    interviewId,
    documentInterviewId,
    detailStep,
    panelLabel: viewPanelLabels[panel] || panel,
    targetKey: targetKey || globalFieldKey('field', label),
    searchText: normalizeGlobalSearch([label, viewPanelLabels[panel], group, compactSearchValue(value)].filter(Boolean).join(' '))
  }
}

const buildViewSearchItems = (candidate, visibleInterviews = []) => {
  const items = [
    createSearchItem({
      label: 'Candidate Details',
      panel: 'details',
      group: 'Panel',
      value: candidate.fullName,
      targetKey: globalFieldKey('section', 'Personal Details'),
      detailStep: 0
    })
  ]

  detailSearchFields.forEach(([label, path]) => {
    const value = path === 'familyDetails.siblingEducation' ? pathValue(candidate, path) || pathValue(candidate, 'familyDetails.siblingEducationOccupation') : pathValue(candidate, path)
    items.push(createSearchItem({ label, panel: 'details', group: 'Candidate Details', value, detailStep: detailStepForPath(path) }))
  })

  const candidateDocumentsByType = groupCandidateDocumentsByType(candidate.documents)
  candidateDocumentTypes.forEach((item) => {
    const docs = candidateDocumentsByType[item.key] || []
    items.push(
      createSearchItem({
        label: item.label,
        panel: 'documents',
        group: 'Candidate Documents',
        value: docs.flatMap((doc) => [doc.documentLabel, doc.fileName, doc.fileUrl]),
        targetKey: globalFieldKey('document', item.key)
      })
    )
  })

  successDocumentTypes.forEach((item) => {
    const docs = candidateDocumentsByType[item.key] || []
    items.push(
      createSearchItem({
        label: item.label,
        panel: 'documents',
        group: 'Success Documents',
        value: docs.flatMap((doc) => [doc.documentLabel, doc.fileName, doc.fileUrl]),
        targetKey: globalFieldKey('document', item.key)
      })
    )
  })

  unmatchedCandidateDocuments(candidate.documents).forEach((doc, index) => {
    items.push(
      createSearchItem({
        label: doc.documentLabel || doc.fileName || `Other Document ${index + 1}`,
        panel: 'documents',
        group: 'Other Uploaded Documents',
        value: [doc.documentType, doc.fileName, doc.fileUrl],
        targetKey: globalFieldKey('document', doc._id || doc.fileUrl || `other-${index}`)
      })
    )
  })

  visibleInterviews.forEach((row, index) => {
    const interviewLabel = `Interview ${index + 1}: ${row.companyName || 'Company Interview'}`
    items.push(
      createSearchItem({
        label: interviewLabel,
        panel: 'interviews',
        group: 'Company Interviews',
        value: [
          row.companyName,
          row.jobRole,
          row.date,
          row.selectionChances,
          row.status,
          row.referencePerson,
          row.note,
          ...(row.documents || []).flatMap((doc) => [doc.documentLabel, doc.fileName])
        ],
        targetKey: globalFieldKey('interviewRow', row.id || index),
        interviewId: row.id
      })
    )

    interviewDetailFields.forEach(([key, label]) => {
      const value = key === 'candidateName' ? row.candidateName || candidate.fullName : row[key]
      items.push(
        createSearchItem({
          label,
          panel: 'interviews',
          group: interviewLabel,
          value,
          targetKey: globalFieldKey('interviewRow', row.id || index),
          interviewId: row.id
        })
      )
    })

    const groupedInterviewDocs = groupInterviewDocumentsByType(row.documents)
    interviewDocumentTypes.forEach((item) => {
      const docs = groupedInterviewDocs[item.key] || []
      items.push(
        createSearchItem({
          label: item.label,
          panel: 'documents',
          group: interviewLabel,
          value: docs.flatMap((doc) => [doc.documentLabel, doc.fileName, doc.fileUrl]),
          targetKey: globalFieldKey('document', item.key),
          documentInterviewId: row.id
        })
      )
    })
  })

  SUCCESS_INFO_FIELDS.forEach((field) => {
    if (field.kind === 'section') {
      items.push(
        createSearchItem({
          label: field.label,
          panel: 'successInfo',
          group: 'Section',
          value: '',
          targetKey: globalFieldKey('section', field.label)
        })
      )
      return
    }
    if (field.showWhen && candidate.successInfo?.[field.showWhen.key] !== field.showWhen.value) return
    items.push(createSearchItem({ label: field.label, panel: 'successInfo', group: 'Success Info', value: candidate.successInfo?.[field.key] }))
  })
  WITNESS_FIELDS.forEach((field) => {
    items.push(createSearchItem({ label: field.label, panel: 'successInfo', group: 'Witness Details', value: candidate.successInfo?.witnesses?.[0]?.[field.key] || candidate.successInfo?.[field.key] }))
  })

  DIRECTOR_ASSESSMENT_FIELDS.forEach((field) => {
    items.push(
      createSearchItem({
        label: field.label,
        panel: 'assessment',
        group: directorAssessmentLabel,
        value: candidate.interviewForm.directorAssessment?.[field.key],
        targetKey: globalFieldKey('assessment', `Director Assessment-${field.key}`)
      })
    )
  })
  MANAGER_ASSESSMENT_FIELDS.forEach((field) => {
    items.push(
      createSearchItem({
        label: field.label,
        panel: 'assessment',
        group: 'Manager Assessment',
        value: candidate.interviewForm.managerAssessment?.[field.key],
        targetKey: globalFieldKey('assessment', `Manager Assessment-${field.key}`)
      })
    )
  })
  ;[
    ['Counseling Of Candidate', 'directorAssessment'],
    ['Counseling Mode', 'directorAssessment'],
    ['Counseling Of Candidate', 'managerAssessment'],
    ['Counseling Mode', 'managerAssessment']
  ].forEach(([label, bucket]) => {
    const group = bucket === 'directorAssessment' ? directorAssessmentLabel : 'Manager Assessment'
    const key = label === 'Counseling Mode' ? 'counselingMode' : 'counselingOfCandidate'
    items.push(
      createSearchItem({
        label,
        panel: 'assessment',
        group,
        value: candidate.interviewForm?.[bucket]?.[key],
        targetKey: globalFieldKey('assessment', `${group}-counselingOfCandidate`)
      })
    )
  })

  PROFESSIONAL_RATING_FIELDS.forEach((field) => {
    items.push(
      createSearchItem({
        label: field.label,
        panel: 'assessment',
        group: 'Professional Assessment',
        value: candidate.interviewForm.professionalRatings?.[field.key],
        targetKey: globalFieldKey('assessment', `Professional Assessment-${field.key}`)
      })
    )
  })
  PERSONALITY_RATING_FIELDS.forEach((field) => {
    items.push(
      createSearchItem({
        label: field.label,
        panel: 'assessment',
        group: 'Personality Assessment',
        value: candidate.interviewForm.personalityRatings?.[field.key],
        targetKey: globalFieldKey('assessment', `Personality Assessment-${field.key}`)
      })
    )
  })
  ;[
    ['Suitable Industry', candidate.interviewForm.suitableIndustry],
    ['Suitable Department', candidate.interviewForm.suitableDepartment],
    ['HR Interviewer', candidate.interviewForm.hrInterviewer],
    ['Remark', candidate.interviewForm.remark]
  ].forEach(([label, value]) => {
    items.push(createSearchItem({ label, panel: 'assessment', group: 'Success Interviewer Remark', value }))
  })
  ;(candidate.interviewForm.questions || []).forEach((row, index) => {
    items.push(
      createSearchItem({
        label: `Question ${index + 1}`,
        panel: 'assessment',
        group: 'Interview Questions',
        value: [row.question, row.marks],
        targetKey: globalFieldKey('question', index + 1)
      })
    )
  })

  ;(candidate.candidateVisits || []).filter(candidateVisitHasContent).forEach((row, index) => {
    const visitLabel = `Visit ${index + 1}`
    items.push(
      createSearchItem({
        label: visitLabel,
        panel: 'visits',
        group: 'Candidate Visits',
        value: [row.visitDateTime, row.purpose, row.purposeOther, row.meetingStaffName, row.communicationDetails],
        targetKey: globalFieldKey('visitRow', row.id || index)
      })
    )
    ;[
      ['Date and Time of Visit', row.visitDateTime],
      ['Purpose for Visit', row.purpose === 'Other' ? row.purposeOther : row.purpose],
      ['Meeting Staff Name', row.meetingStaffName],
      ['Communication Details', row.communicationDetails]
    ].forEach(([label, value]) => {
      items.push(
        createSearchItem({
          label,
          panel: 'visits',
          group: visitLabel,
          value,
          targetKey: globalFieldKey('visitRow', row.id || index)
        })
      )
    })
  })

  return items
}

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
            <div key={key} className="rounded-lg bg-white p-3 ring-1 ring-slate-200" data-global-field={globalFieldKey('field', label)}>
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">{value || '-'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CandidateVisitsView({ visits, onEditHint }) {
  const rows = (Array.isArray(visits) ? visits : []).filter(candidateVisitHasContent)

  return (
    <Section title="Number of Visits" icon={ClipboardList} searchKey={globalFieldKey('section', 'Number of Visits')}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase text-slate-500">Candidate Visit Count</p>
        <p className="mt-1 text-lg font-bold text-slate-950">{rows.length}</p>
      </div>

      {rows.length ? (
        <div className="space-y-4">
          {rows.map((visit, index) => (
            <div key={visit.id || index} className="rounded-xl border border-slate-200 bg-white p-4" data-global-field={globalFieldKey('visitRow', visit.id || index)}>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Visit {index + 1}</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Date and Time of Visit">
                  <ReadOnlyInput value={visit.visitDateTime} onEditHint={onEditHint} />
                </Field>
                <Field label="Purpose for Visit">
                  <ReadOnlyInput value={visit.purpose === 'Other' ? visit.purposeOther : visit.purpose} onEditHint={onEditHint} />
                </Field>
                <Field label="Meeting Staff Name">
                  <ReadOnlyInput value={visit.meetingStaffName} onEditHint={onEditHint} />
                </Field>
                <Field label="Communication Details" className="md:col-span-2 xl:col-span-3">
                  <ReadOnlyTextArea value={visit.communicationDetails} onEditHint={onEditHint} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">No candidate visits added yet.</p>
      )}
    </Section>
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
  const [candidateDetailsStep, setCandidateDetailsStep] = useState(0)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
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

  const displayedCollegeReferences = collegeReferenceRows(candidate)
  const candidateDocumentsByType = groupCandidateDocumentsByType(candidate.documents)
  const extraCandidateDocuments = unmatchedCandidateDocuments(candidate.documents)
  const selectedDocumentInterview = visibleInterviews.find((row) => String(row.id) === String(documentInterviewId)) || visibleInterviews[0] || null
  const selectedInterviewDocumentsByType = groupInterviewDocumentsByType(selectedDocumentInterview?.documents)
  const viewSearchItems = buildViewSearchItems(candidate, visibleInterviews)
  const normalizedGlobalSearchTerm = normalizeGlobalSearch(globalSearchTerm)
  const globalSearchResults = normalizedGlobalSearchTerm
    ? viewSearchItems.filter((item) => item.searchText.includes(normalizedGlobalSearchTerm)).slice(0, 18)
    : []
  const successInfoWitnesses = Array.isArray(candidate.successInfo?.witnesses) && candidate.successInfo.witnesses.length
    ? candidate.successInfo.witnesses
    : [candidate.successInfo || {}]
  const selectGlobalSearchResult = (item) => {
    setActivePanel(item.panel)
    if (item.panel === 'details' && Number.isInteger(item.detailStep)) {
      setCandidateDetailsStep(Math.max(0, Math.min(item.detailStep, viewDetailSteps.length - 1)))
    }

    if (item.interviewId) {
      const match = visibleInterviews.find((row) => String(row.id) === String(item.interviewId))
      if (match) setSelectedInterview(match)
    }

    if (item.documentInterviewId) {
      setDocumentInterviewId(item.documentInterviewId)
    }

    setGlobalSearchTerm(item.label)
    scrollToGlobalField(item.targetKey)
  }

  const exportCandidateExcel = () => {
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id || 'candidate')
    downloadBlob(createCandidateExcelWorkbook(candidate), `${candidateName}-Candidate-Details.xls`)
    toast.success('Candidate details Excel downloaded')
  }

  const exportSuccessInfoPdf = () => {
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id || 'candidate')
    downloadBlob(createSuccessInfoPdf(candidate), `${candidateName}-Success-Info.pdf`)
    toast.success('Success info PDF downloaded')
  }

  const exportAssessmentPdf = async () => {
    if (!id || activePanel !== 'assessment') return
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id)
    const panelName = safeFileName(viewPanelLabels.assessment)

    try {
      const { data } = await api.get(`/cms/candidates/${id}/success-remark.pdf`, { responseType: 'blob' })
      downloadBlob(data, `${candidateName}-${panelName}.pdf`)
      toast.success('PDF downloaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not export PDF')
    }
  }

  const exportCompanyInterviewPdf = (row) => {
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id || 'candidate')
    const companyName = safeFileName(row?.companyName || 'company-interview')
    downloadBlob(createCompanyInterviewPdf(candidate, row), `${candidateName}-${companyName}-Interview.pdf`)
    toast.success('Company interview PDF downloaded')
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 sm:gap-6">
      <div className="sticky top-0 z-20 -mx-3 bg-slate-100/95 px-3 pb-3 pt-1 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/cms/candidates')}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-6 text-slate-950 sm:text-xl">{candidate.fullName}</h1>
              {candidate.candidateCode ? <p className="truncate text-xs font-semibold text-slate-500">Candidate ID: {candidate.candidateCode}</p> : null}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {activePanel === 'details' ? (
              <button
                type="button"
                onClick={exportCandidateExcel}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export Details Excel
              </button>
            ) : null}
            {activePanel === 'successInfo' ? (
              <button
                type="button"
                onClick={exportSuccessInfoPdf}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export Success PDF
              </button>
            ) : null}
            {activePanel === 'assessment' ? (
              <button
                type="button"
                onClick={exportAssessmentPdf}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            ) : null}
            {!viewOnly ? (
              <button
                type="button"
                onClick={goToEdit}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
              >
                <Pencil className="h-4 w-4" />
                Update
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <CandidateGlobalSearch value={globalSearchTerm} results={globalSearchResults} onChange={setGlobalSearchTerm} onSelect={selectGlobalSearchResult} />
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activePanel === 'details'} label="Candidate Details" onClick={() => setActivePanel('details')} />
        <TabButton active={activePanel === 'documents'} label="Documents" onClick={() => setActivePanel('documents')} />
        <TabButton active={activePanel === 'successInfo'} label="Success Info For Candidate" onClick={() => setActivePanel('successInfo')} />
        <TabButton active={activePanel === 'assessment'} label="Success Interviewer Remark" onClick={() => setActivePanel('assessment')} />
        <TabButton active={activePanel === 'interviews'} label="Company Interviews" onClick={() => setActivePanel('interviews')} />
        <TabButton active={activePanel === 'visits'} label="Number of Visits" onClick={() => setActivePanel('visits')} />
      </div>

      {activePanel === 'details' ? (
        <>
          <DetailStepTabs currentStep={candidateDetailsStep} onStep={setCandidateDetailsStep} />

          {candidateDetailsStep === 0 ? (
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
              <Field label="Current Flat No / House No, Society, Landmark">
                <ReadOnlyInput value={candidate.currentAddressLine} onEditHint={showEditHint} />
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
              <Field label="Permanent Flat No / House No, Society, Landmark">
                <ReadOnlyInput value={candidate.permanentAddressLine} onEditHint={showEditHint} />
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
              <Field label="Father / Husband Occupation">
                <ReadOnlyInput value={candidate.familyDetails.fatherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Father / Husband Mobile Number">
                <ReadOnlyInput value={candidate.familyDetails.fatherMobileNumber} onEditHint={showEditHint} />
              </Field>
              <Field label="Mother / Wife Name">
                <ReadOnlyInput value={candidate.familyDetails.motherOrWifeName} onEditHint={showEditHint} />
              </Field>
              <Field label="Mother / Wife Occupation">
                <ReadOnlyInput value={candidate.familyDetails.motherOccupation} onEditHint={showEditHint} />
              </Field>
              <Field label="Mother / Wife Mobile Number">
                <ReadOnlyInput value={candidate.familyDetails.motherMobileNumber} onEditHint={showEditHint} />
              </Field>
              <div className="md:col-span-2 xl:col-span-3">
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-sm font-bold text-slate-800">Sibling Details</p>
                  {siblingRows(candidate.familyDetails).length ? (
                    siblingRows(candidate.familyDetails).map((sibling, siblingIndex) => (
                      <div key={siblingIndex} className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sibling {siblingIndex + 1}</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <Field label="Sibling / Brother / Sister Name">
                            <ReadOnlyInput value={sibling.siblingName} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister Education">
                            <ReadOnlyInput value={sibling.siblingEducation || sibling.siblingEducationOccupation} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister Mobile Number">
                            <ReadOnlyInput value={sibling.siblingMobileNumber} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister DOB">
                            <ReadOnlyInput type="date" value={sibling.siblingDateOfBirth} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister Age">
                            <ReadOnlyInput type="number" value={sibling.siblingAge} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister Gender">
                            <ReadOnlyInput value={sibling.siblingGender} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister Career Profile">
                            <ReadOnlyInput value={sibling.siblingCareerProfile} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Sibling / Brother / Sister Study Standard">
                            <ReadOnlyInput value={sibling.siblingStudyStandard} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Other Sibling / Brother / Sister Study Standard">
                            <ReadOnlyInput value={sibling.siblingStudyStandardOther} onEditHint={showEditHint} />
                          </Field>
                          <Field label="Other Sibling / Brother / Sister Career Profile">
                            <ReadOnlyInput value={sibling.siblingCareerProfileOther} onEditHint={showEditHint} />
                          </Field>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-white px-3 py-3 text-sm font-semibold text-slate-500">No sibling details added.</p>
                  )}
                </div>
              </div>
            </FieldGroup>
          </Section>
          ) : null}

          {candidateDetailsStep === 1 ? (
          <Section title="Education Details" icon={ClipboardList}>
            <FieldGroup title="Education">
              <Field label="Highest Education Like Graduate, Post Graduate">
                <ReadOnlyInput value={candidate.educationSector} onEditHint={showEditHint} />
              </Field>
              <Field label="Passing Year of Education">
                <ReadOnlyInput value={candidate.yearOfHigherEducation} onEditHint={showEditHint} />
              </Field>
              <Field label="Education Branch">
                <ReadOnlyInput value={candidate.educationBranch === 'Other' ? candidate.educationBranchOther : candidate.educationBranch} onEditHint={showEditHint} />
              </Field>
              <Field label="Special Subject / Remark">
                <ReadOnlyInput value={candidate.educationSpecialization === 'Other' ? candidate.educationSpecializationOther : candidate.educationSpecialization} onEditHint={showEditHint} />
              </Field>
              <Field label="Computer Courses">
                <ReadOnlyInput value={candidate.computerCourse} onEditHint={showEditHint} />
              </Field>
              {candidate.computerCourse === 'Typing' ? (
                <Field label="Typing Selection">
                  <ReadOnlyInput
                    value={[
                      candidate.englishTyping ? 'English Typing' : '',
                      candidate.hindiTyping ? 'Hindi Typing' : ''
                    ].filter(Boolean).join(', ')}
                    onEditHint={showEditHint}
                  />
                </Field>
              ) : null}
              <Field label="Other Certification Courses">
                <ReadOnlyInput value={candidate.certificationCourse} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="College Reference Details (Like 12th, ITI, Diploma, Graduate)">
              {displayedCollegeReferences.map((reference, referenceIndex) => (
                <div key={referenceIndex} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:col-span-2 xl:col-span-3">
                  <h4 className="mb-3 text-sm font-bold text-slate-700">College Reference {referenceIndex + 1}</h4>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="College Name">
                      <ReadOnlyInput value={reference.instituteName} onEditHint={showEditHint} />
                    </Field>
                    <Field label="College Education Branch">
                      <ReadOnlyInput value={reference.educationBranch === 'Other' ? reference.educationBranchOther : reference.educationBranch} onEditHint={showEditHint} />
                    </Field>
                    <Field label="College Representative Name">
                      <ReadOnlyInput value={reference.representativeName} onEditHint={showEditHint} />
                    </Field>
                    <Field label="Designation">
                      <ReadOnlyInput value={reference.designation === 'Other' ? reference.designationOther : reference.designation} onEditHint={showEditHint} />
                    </Field>
                    <Field label="Mobile Number">
                      <ReadOnlyInput value={reference.mobileNumber} onEditHint={showEditHint} />
                    </Field>
                    <Field label="College Village">
                      <ReadOnlyInput value={reference.addressVillage} onEditHint={showEditHint} />
                    </Field>
                    <Field label="College Taluka">
                      <ReadOnlyInput value={reference.addressTaluka} onEditHint={showEditHint} />
                    </Field>
                    <Field label="College District">
                      <ReadOnlyInput value={reference.addressDistrict} onEditHint={showEditHint} />
                    </Field>
                    <Field label="College State">
                      <ReadOnlyInput value={reference.addressState} onEditHint={showEditHint} />
                    </Field>
                  </div>
                </div>
              ))}
              <Field label="College Village">
                <ReadOnlyInput value={candidate.instituteAddressVillage} onEditHint={showEditHint} />
              </Field>
              <Field label="College Taluka">
                <ReadOnlyInput value={candidate.instituteAddressTaluka} onEditHint={showEditHint} />
              </Field>
              <Field label="College District">
                <ReadOnlyInput value={candidate.instituteAddressDistrict} onEditHint={showEditHint} />
              </Field>
              <Field label="College State">
                <ReadOnlyInput value={candidate.instituteAddressState} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Post Graduate Reference Details">
              <Field label="College Name">
                <ReadOnlyInput value={candidate.postGraduateReference?.instituteName} onEditHint={showEditHint} />
              </Field>
              <Field label="College Education Branch">
                <ReadOnlyInput
                  value={candidate.postGraduateReference?.educationBranch === 'Other' ? candidate.postGraduateReference?.educationBranchOther : candidate.postGraduateReference?.educationBranch}
                  onEditHint={showEditHint}
                />
              </Field>
              <Field label="College Representative Name">
                <ReadOnlyInput value={candidate.postGraduateReference?.representativeName} onEditHint={showEditHint} />
              </Field>
              <Field label="Designation">
                <ReadOnlyInput
                  value={candidate.postGraduateReference?.designation === 'Other' ? candidate.postGraduateReference?.designationOther : candidate.postGraduateReference?.designation}
                  onEditHint={showEditHint}
                />
              </Field>
              <Field label="Mobile Number">
                <ReadOnlyInput value={candidate.postGraduateReference?.mobileNumber} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Institute Details (Private Coaching Classes)">
              <Field label="Institute Representative Name">
                <ReadOnlyInput value={candidate.collegeTeacherName} onEditHint={showEditHint} />
              </Field>
              <Field label="Course Branch">
                <ReadOnlyInput value={candidate.collegeCourseBranch === 'Other' ? candidate.collegeCourseBranchOther : candidate.collegeCourseBranch} onEditHint={showEditHint} />
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
            </FieldGroup>
          </Section>
          ) : null}

          {candidateDetailsStep === 2 ? (
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
              <Field label="Expected Salary Negotiable">
                <ReadOnlyInput value={candidate.expectedSalaryNegotiable} onEditHint={showEditHint} />
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
              <Field label="Current Job Location (Taluka)">
                <ReadOnlyInput value={candidate.currentJobLocation} onEditHint={showEditHint} />
              </Field>
              <Field label="Other Current Job Location (Taluka)">
                <ReadOnlyInput value={candidate.currentJobLocationOther} onEditHint={showEditHint} />
              </Field>
              <Field label="Current Job Location (MIDC Area)">
                <ReadOnlyInput value={candidate.currentJobLocationMidcArea} onEditHint={showEditHint} />
              </Field>
              <Field label="Other MIDC Area">
                <ReadOnlyInput value={candidate.currentJobLocationMidcAreaOther} onEditHint={showEditHint} />
              </Field>
              <Field label="Preferred Job Location">
                <ReadOnlyInput value={candidate.preferredJobLocation} onEditHint={showEditHint} />
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
              <Field label="Enter Total Year of Experience">
                <ReadOnlyInput value={candidate.totalExperience} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Notice Period">
              <Field label="Notice Period">
                <ReadOnlyInput value={candidate.noticePeriod} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Availability for Interview">
              <Field label="Availability for Interview">
                <ReadOnlyInput value={candidate.availabilityForInterview} onEditHint={showEditHint} />
              </Field>
              <Field label="Interview Mode">
                <ReadOnlyInput value={candidate.interviewMode} onEditHint={showEditHint} />
              </Field>
              <Field label="Online Interview Mode">
                <ReadOnlyInput value={candidate.onlineInterviewMode} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Reason For Job Change">
              <Field label="Reason For Job Change">
                <ReadOnlyInput value={candidate.reasonForJobChange} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Key Skills You Have">
              <Field label="Key Skills You Have">
                <ReadOnlyInput value={candidate.keySkillsKnowledge} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>

            <FieldGroup title="Key Job Responsibility As Per Your Experience">
              <Field label="Responsibility Type">
                <ReadOnlyInput value={candidate.careerResponsibilityRole === 'Other' ? candidate.careerResponsibilityRoleOther : candidate.careerResponsibilityRole} onEditHint={showEditHint} />
              </Field>
              <Field label="Key Job Responsibility As Per Your Experience">
                <ReadOnlyInput value={candidate.careerJobResponsibilities} onEditHint={showEditHint} />
              </Field>
            </FieldGroup>
          </Section>
          ) : null}

          {candidateDetailsStep === 3 ? (
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
              <Field label="Reference Relation">
                <ReadOnlyInput value={candidate.referenceRelation === 'Other' ? candidate.referenceRelationOther : candidate.referenceRelation} onEditHint={showEditHint} />
              </Field>
              <Field label="Reference Source" className="md:col-span-2 xl:col-span-3">
                <ReadOnlyInput value={(candidate.referenceSources || []).join(', ')} onEditHint={showEditHint} />
              </Field>
              {(candidate.referenceSources || []).includes('Other') ? (
                <Field label="Other Reference Source" className="md:col-span-2 xl:col-span-3">
                  <ReadOnlyInput value={candidate.referenceSourceOther} onEditHint={showEditHint} />
                </Field>
              ) : null}
            </FieldGroup>
          </Section>
          ) : null}
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
                    <DocumentCard key={doc._id || `${doc.fileUrl}-${index}`} doc={doc} searchKey={globalFieldKey('document', doc._id || doc.fileUrl || `other-${index}`)} />
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
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Witness Details</h3>
              </div>
              {successInfoWitnesses.map((witness, witnessIndex) => (
                <div key={witnessIndex} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-700">Witness {witnessIndex + 1}</h4>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {WITNESS_FIELDS.map((field) => {
                      if (field.showWhen && witness?.[field.showWhen.key] !== field.showWhen.value) return null

                      return (
                        <Field key={field.key} label={field.label}>
                          <ReadOnlyInput value={witness?.[field.key]} onEditHint={showEditHint} />
                        </Field>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SUCCESS_INFO_FIELDS.map((field) => {
              if (field.kind === 'section') {
                return (
                  <div key={field.label} className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0 md:col-span-2 xl:col-span-3" data-global-field={globalFieldKey('section', field.label)}>
                    <h3 className="text-sm font-bold text-slate-800">{field.label}</h3>
                  </div>
                )
              }
              if (field.showWhen && candidate.successInfo?.[field.showWhen.key] !== field.showWhen.value) return null
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
          </div>
        </Section>
      ) : null}

      {activePanel === 'assessment' ? (
        <Section title="Success Interviewer Remark">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Candidate Name</p>
            <p className="mt-1 text-base font-bold text-slate-950">{candidate.fullName || '-'}</p>
          </div>

          <AssessmentView title={directorAssessmentLabel} fields={DIRECTOR_ASSESSMENT_FIELDS} assessment={candidate.interviewForm.directorAssessment} onEditHint={showEditHint} />
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
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-12 px-3 py-3 sm:w-14 sm:px-4">#</th>
                  <th className="px-3 py-3 sm:px-4">Company Name</th>
                  <th className="w-40 px-3 py-3 sm:px-4">Job Role/Department</th>
                  <th className="w-36 px-3 py-3 sm:px-4">Interview Date</th>
                  <th className="w-36 px-3 py-3 sm:px-4">Selection Chances</th>
                  <th className="w-96 px-3 py-3 text-right sm:px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleInterviews.map((row, index) => (
                  <tr key={row.id} className="odd:bg-white even:bg-slate-50" data-global-field={globalFieldKey('interviewRow', row.id || index)}>
                    <td className="px-3 py-3 text-slate-500 sm:px-4">{index + 1}</td>
                    <td className="truncate px-3 py-3 font-semibold text-slate-900 sm:px-4">{row.companyName || '-'}</td>
                    <td className="truncate px-3 py-3 text-slate-700 sm:px-4">{row.jobRole || '-'}</td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{row.date || '-'}</td>
                    <td className="px-3 py-3 text-slate-700 sm:px-4">{row.selectionChances || '-'}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => exportCompanyInterviewPdf(row)}
                          className="inline-flex h-9 min-w-28 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          <Download className="h-4 w-4 shrink-0" />
                          Export PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedInterview(row)}
                          className="inline-flex h-9 min-w-20 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4 shrink-0" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/cms/candidates/${id}/edit?panel=interviews&interview=${row.id}`)}
                          className="inline-flex h-9 min-w-24 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <Pencil className="h-4 w-4 shrink-0" />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingInterview(row)}
                          className="inline-flex h-9 min-w-24 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
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
          <InterviewDetailsPanel row={selectedInterview} candidateName={candidate.fullName} onClose={() => setSelectedInterview(null)} />
        </Section>
      ) : null}

      {activePanel === 'visits' ? (
        <CandidateVisitsView visits={candidate.candidateVisits} onEditHint={showEditHint} />
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
