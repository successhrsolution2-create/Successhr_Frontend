import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileImage,
  GraduationCap,
  Handshake,
  Loader2,
  UploadCloud,
  UserRound,
  X
} from 'lucide-react'
import api from '../../api/axios'
import {
  allowedDocumentImageTypes,
  computerCourseDocumentTypes,
  educationCertificateDocumentTypes,
  educationCertificateLabel,
  MAX_DOCUMENT_IMAGE_SIZE,
  standaloneCandidateDocumentTypes
} from '../../candidate/constants/candidateDocuments'

const hiddenApplyDocumentKeys = new Set(['candidatePhoto'])
const visibleApplyStandaloneDocumentTypes = standaloneCandidateDocumentTypes.filter(
  (documentType) => !hiddenApplyDocumentKeys.has(documentType.key)
)
const resumeCandidateDocumentType = visibleApplyStandaloneDocumentTypes.find((documentType) => documentType.key === 'updatedResume')
const otherCandidateDocumentTypes = visibleApplyStandaloneDocumentTypes.filter((documentType) => documentType.key !== 'updatedResume')

const initialForm = {
  candidateName: '',
  mobileNumber: '',
  whatsappNo: '',
  emailId: '',
  gender: '',
  currentAge: '',
  marriageStatus: '',
  aadhaarNo: '',
  panNo: '',
  dateOfBirth: '',
  currentAddress: '',
  permanentAddress: '',
  educationSector: '',
  educationSectorOther: '',
  educationBranch: '',
  educationBranchOther: '',
  computerCourse: '',
  computerCourseOther: '',
  certificationCourse: '',
  certificationCourseOther: '',
  educationSpecialization: '',
  educationSpecializationOther: '',
  collegeName: '',
  instituteDesignation: '',
  college12GraduateName: '',
  postGraduateCollegeName: '',
  collegeTeacherName: '',
  collegeDesignation: '',
  collegeMobileNumber: '',
  collegeReference: '',
  education: '',
  yearOfHigherEducation: '',
  computerCourses: '',
  otherAchievements: '',
  professorName: '',
  professorContactNumber: '',
  referenceBy: '',
  referenceContactNumber: '',
  referenceProfile: '',
  referenceProfileOther: '',
  referenceSourceOther: '',
  appliedFor: '',
  interestedDepartment: '',
  lookingForField: '',
  preferredIndustry: '',
  preferredIndustryOther: '',
  industrySpecialization: '',
  industrySpecializationOther: '',
  preferredJobLocation: '',
  currentJobLocation: '',
  currentJobLocationOther: '',
  currentJobLocationMidcArea: '',
  currentJobLocationMidcAreaOther: '',
  availabilityForInterview: '',
  availabilityInterviewStartDate: '',
  availabilityInterviewEndDate: '',
  interviewMode: '',
  totalExperience: '',
  experienceDepartment: '',
  currentCompany: '',
  keySkillsKnowledge: '',
  careerJobResponsibilities: '',
  keyResponsibilities: '',
  netInHandSalary: '',
  grossSalaryPerMonth: '',
  ctcSalaryPerMonth: '',
  expectedNetInHandSalary: '',
  expectedGrossSalaryPerMonth: '',
  expectedCtcSalaryPerMonth: '',
  currentSalary: '',
  expectedSalary: '',
  jobWorkingStatus: '',
  experienceType: '',
  noticePeriod: '',
  noticePeriodOther: '',
  careerSummary: '',
  reasonForJobChange: '',
  reasonForJobChangeOther: '',
  fatherOrHusbandName: '',
  fatherOccupation: '',
  fatherMobileNumber: '',
  motherOrWifeName: '',
  motherOccupation: '',
  motherMobileNumber: '',
  siblingName: '',
  siblingEducation: '',
  siblingMobileNumber: '',
  siblingDateOfBirth: '',
  siblingAge: '',
  siblingGender: '',
  siblingCareerProfile: '',
  siblingStudyStandard: '',
  siblingStudyStandardOther: '',
  siblingCareerProfileOther: '',
  feedback: '',
  suggestion: ''
}

const formSteps = [
  { title: 'Personal Details', icon: UserRound },
  { title: 'Education Details', icon: GraduationCap },
  { title: 'Professional Details', icon: BriefcaseBusiness },
  { title: 'Reference Success Details', icon: Handshake },
  { title: 'Document', icon: FileImage }
]

const personalFields = [
  { name: 'candidateName', label: 'Candidate Name', required: true },
  { name: 'mobileNumber', label: 'Mobile Number', required: true, inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'whatsappNo', label: 'WhatsApp Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'emailId', label: 'Email ID', required: true, type: 'email' },
  { name: 'aadhaarNo', label: 'Aadhar Card Number', inputMode: 'numeric', maxLength: 12, digitsOnly: true },
  { name: 'panNo', label: 'PAN Number', maxLength: 10, uppercase: true },
  { name: 'dateOfBirth', label: 'DOB', type: 'date' },
  { name: 'currentAge', label: 'Current Age', type: 'number', readOnly: true }
]

const instituteReferenceFields = [
  { name: 'collegeName', label: 'Institute Name' },
  { name: 'professorName', label: 'Institute Representative Name' },
  { name: 'instituteDesignation', label: 'Designation' },
  { name: 'professorContactNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true }
]

const instituteCollegeFields = [
  { name: 'collegeTeacherName', label: 'Teacher' },
  { name: 'collegeDesignation', label: 'Designation' },
  { name: 'collegeMobileNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'collegeReference', label: 'Reference' }
]

const siblingCareerProfileOptions = ['', 'Studying', 'Own Business', 'Doing Government Job Preparation', 'Housewife', 'Farmer', 'Doing Government Job', 'Doing Private Job', 'Other']
const siblingStudyStandardOptions = [
  '',
  '1st Standard',
  '2nd Standard',
  '3rd Standard',
  '4th Standard',
  '5th Standard',
  '6th Standard',
  '7th Standard',
  '8th Standard',
  '9th Standard',
  '10th Standard',
  '11th Standard',
  '12th Standard',
  'Diploma',
  'Graduate',
  'PG',
  'Other'
]

const currentJobLocationTalukaOptions = ['', 'Sinnar', 'Nashik', 'Mumbai', 'Pune', 'Sangamner', 'Ahilyanagar', 'Sambhaji Nagar', 'Other']
const currentJobLocationMidcAreaOptions = ['', 'Musalgaon', 'Malegaon', 'Ambad', 'Satpur', 'Other']

const currentSalaryFields = [
  { name: 'netInHandSalary', label: 'NET / In-hand Salary', inputMode: 'numeric' },
  { name: 'grossSalaryPerMonth', label: 'Gross Per Month', inputMode: 'numeric' },
  { name: 'ctcSalaryPerMonth', label: 'CTC Per Month', inputMode: 'numeric' },
  { name: 'currentJobLocation', label: 'Current Job Location (Taluka)', options: currentJobLocationTalukaOptions },
  { name: 'currentJobLocationOther', label: 'Other Current Job Location (Taluka)', showWhen: { name: 'currentJobLocation', value: 'Other' } },
  { name: 'currentJobLocationMidcArea', label: 'Current Job Location (MIDC Area)', options: currentJobLocationMidcAreaOptions },
  { name: 'currentJobLocationMidcAreaOther', label: 'Other MIDC Area', showWhen: { name: 'currentJobLocationMidcArea', value: 'Other' } },
  { name: 'preferredJobLocation', label: 'Preferred Job Location' }
]

const expectedSalaryFields = [
  { name: 'expectedNetInHandSalary', label: 'Expected NET / In-hand Salary', inputMode: 'numeric' },
  { name: 'expectedGrossSalaryPerMonth', label: 'Expected Gross Per Month', inputMode: 'numeric' },
  { name: 'expectedCtcSalaryPerMonth', label: 'Expected CTC Per Month', inputMode: 'numeric' }
]

const familyFields = [
  { name: 'fatherOrHusbandName', label: 'Father / Husband Name' },
  { name: 'fatherOccupation', label: 'Father Occupation' },
  { name: 'fatherMobileNumber', label: 'Father Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'motherOrWifeName', label: 'Mother / Wife Name' },
  { name: 'motherOccupation', label: 'Mother Occupation' },
  { name: 'motherMobileNumber', label: 'Mother Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'siblingName', label: 'Sibling Name' },
  { name: 'siblingEducation', label: 'Sibling Education' },
  { name: 'siblingMobileNumber', label: 'Sibling Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'siblingDateOfBirth', label: 'Sibling DOB', type: 'date' },
  { name: 'siblingAge', label: 'Sibling Age', type: 'number', readOnly: true },
  { name: 'siblingGender', label: 'Sibling Gender', options: ['', 'Male', 'Female', 'Other'] },
  { name: 'siblingCareerProfile', label: 'Sibling Career Profile', options: siblingCareerProfileOptions },
  { name: 'siblingStudyStandard', label: 'Sibling Study Standard', options: siblingStudyStandardOptions, showWhen: { name: 'siblingCareerProfile', value: 'Studying' } },
  { name: 'siblingStudyStandardOther', label: 'Other Study Standard', showWhen: { name: 'siblingStudyStandard', value: 'Other' } },
  { name: 'siblingCareerProfileOther', label: 'Other Career Profile', showWhen: { name: 'siblingCareerProfile', value: 'Other' } }
]

const addressPartFields = [
  { name: 'village', label: 'Village' },
  { name: 'taluka', label: 'Taluka' },
  { name: 'district', label: 'District' },
  { name: 'state', label: 'State' }
]

const educationSectorOptions = ['', '10th', '12th', 'Graduate', 'PG', 'PHD', 'ITI', 'Diploma', 'Degree', 'Other']
const higherEducationYearOptions = ['', ...Array.from({ length: 67 }, (_, index) => String(new Date().getFullYear() + 4 - index))]
const educationBranchOptions = ['', 'Arts', 'Commerce', 'Science', 'Diploma/BE', 'Pharmacy', 'MBA', 'Nursing', 'ITI', 'Computer Application', 'Computer Science', 'Other']
const computerCourseOptions = ['', 'MS-CIT', 'CCC', 'Advanced Excel', 'PowerPoint', 'Tally', 'AutoCAD', 'Typing', 'Other']
const certificationCourseOptions = ['', 'Graphic Design', 'C++', 'Java', 'PHP', 'Python', 'Web Development', 'Digital Marketing', 'Data Analytics', 'Other']
const educationSpecializationOptions = ['', 'Chemistry', 'Microbiology', 'Physics', 'Mathematics', 'Botany', 'Zoology', 'Biotechnology', 'Biochemistry', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Computer Science', 'Information Technology', 'Accounting', 'Finance', 'Marketing', 'HR', 'Pharmacy', 'Nursing', 'Other']
const preferredDepartmentOptions = ['', 'Accounts', 'Sales', 'Quality', 'HR', 'Admin', 'Production', 'Operations', 'Purchase', 'Store', 'Logistics', 'Dispatch', 'Customer Support', 'Marketing', 'Finance', 'IT', 'Design', 'Maintenance', 'Research & Development', 'Safety', 'Front Office', 'Back Office', 'Warehouse']
const preferredIndustryOptions = ['', 'Manufacturing', 'Banking', 'Finance', 'Insurance', 'IT', 'Non IT', 'Services', 'Educational', 'Healthcare', 'Pharmaceutical', 'Automobile', 'FMCG', 'Retail', 'Real Estate', 'Construction', 'Logistics', 'Telecom', 'Hospitality', 'Textile', 'Chemical', 'Food Processing', 'E-commerce', 'Consulting', 'Other']
const industrySpecializationOptions = ['', 'Manufacturing', 'Food', 'Pharma', 'Polymer', 'FMCG', 'Chemical', 'Cosmetics', 'Plastic', 'Engineering', 'Automobile', 'Any Industry', 'Textile', 'Packaging', 'Electrical', 'Electronics', 'Agriculture', 'Healthcare', 'Construction', 'Logistics', 'Other']
const jobWorkingStatusOptions = ['', 'Working', 'Jobless']
const experienceTypeOptions = ['', 'Fresher', 'Experience']
const noticePeriodOptions = ['', 'Immediate Joiner', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Other']
const interviewModeOptions = ['', 'Online', 'Offline', 'Face to Face']
const reasonForJobChangeOptions = ['', 'Looking for financial and personal growth', 'Looking for opportunity in native place', 'Facing challenge in current company', 'Any Other']
const referenceSourceOptions = ['Social Media', 'WhatsApp', 'Facebook', 'Instagram', 'LinkedIn', 'Friend', 'Relatives', 'Other']
const referenceProfileOptions = ['', 'Professional', 'Farmer', 'Student', 'Other']

const requiredFields = ['candidateName', 'mobileNumber', 'emailId']
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const MAX_DOCUMENT_FILES_PER_TYPE = 10

const createEmptyAddressParts = () => ({
  village: '',
  taluka: '',
  district: '',
  state: ''
})

const formatAddressParts = (parts) =>
  addressPartFields
    .map((field) => [field.label, String(parts[field.name] || '').trim()])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join(', ')

const getSelectedOptionValue = (value, otherValue) => {
  const selected = String(value || '').trim()
  if (selected !== 'Other') return selected
  return String(otherValue || '').trim() || selected
}

const formatEducationDetails = (form) => {
  const sector = getSelectedOptionValue(form.educationSector, form.educationSectorOther)
  const yearOfHigherEducation = String(form.yearOfHigherEducation || '').trim()
  const branch = getSelectedOptionValue(form.educationBranch, form.educationBranchOther)
  const specialization = getSelectedOptionValue(form.educationSpecialization, form.educationSpecializationOther)
  const qualificationDetails = String(form.education || '').trim()

  return [
    sector ? `Highest Education Like Graduate, Post Graduate: ${sector}` : '',
    yearOfHigherEducation ? `Passing Year of Education: ${yearOfHigherEducation}` : '',
    branch ? `Education Branch: ${branch}` : '',
    specialization ? `Education Specialization: ${specialization}` : '',
    qualificationDetails ? `Qualification Details: ${qualificationDetails}` : ''
  ].filter(Boolean).join('\n')
}

const formatComputerCourses = (form) => {
  const computerCourse = getSelectedOptionValue(form.computerCourse, form.computerCourseOther)
  const certificationCourse = getSelectedOptionValue(form.certificationCourse, form.certificationCourseOther)

  return [
    computerCourse ? `Computer Course: ${computerCourse}` : '',
    certificationCourse ? `Other Certification Course: ${certificationCourse}` : ''
  ].filter(Boolean).join('\n')
}

const formatInstituteReferenceDetails = (form, instituteAddress) =>
  [
    form.collegeName?.trim() ? `Institute Name: ${form.collegeName.trim()}` : '',
    form.professorName?.trim() ? `Institute Representative Name: ${form.professorName.trim()}` : '',
    form.instituteDesignation?.trim() ? `Designation: ${form.instituteDesignation.trim()}` : '',
    form.professorContactNumber?.trim() ? `Institute Mobile Number: ${form.professorContactNumber.trim()}` : '',
    instituteAddress ? `Institute Address: ${instituteAddress}` : ''
  ].filter(Boolean).join('\n')

const formatInstituteCollegeDetails = (form, collegeAddress) =>
  [
    form.collegeTeacherName?.trim() ? `Teacher: ${form.collegeTeacherName.trim()}` : '',
    form.collegeDesignation?.trim() ? `Designation: ${form.collegeDesignation.trim()}` : '',
    form.collegeMobileNumber?.trim() ? `College Mobile Number: ${form.collegeMobileNumber.trim()}` : '',
    form.collegeReference?.trim() ? `Reference: ${form.collegeReference.trim()}` : '',
    collegeAddress ? `College Address: ${collegeAddress}` : ''
  ].filter(Boolean).join('\n')

const formatCareerSummary = (form) => {
  const industrySpecialization = getSelectedOptionValue(form.industrySpecialization, form.industrySpecializationOther)
  const jobWorkingStatus = String(form.jobWorkingStatus || '').trim()
  const experienceType = String(form.experienceType || '').trim()
  const noticePeriod = getSelectedOptionValue(form.noticePeriod, form.noticePeriodOther)
  const careerSummary = String(form.careerSummary || '').trim()

  return [
    industrySpecialization ? `Industry Specialization: ${industrySpecialization}` : '',
    jobWorkingStatus ? `Job Working Status: ${jobWorkingStatus}` : '',
    experienceType ? `Total Experience Type: ${experienceType}` : '',
    noticePeriod ? `Notice Period: ${noticePeriod}` : '',
    formatInterviewAvailability(form) ? `Availability for Interview:\n${formatInterviewAvailability(form)}` : '',
    careerSummary ? `Career Summary: ${careerSummary}` : ''
  ].filter(Boolean).join('\n')
}

const formatInterviewAvailability = (form) =>
  [
    form.availabilityInterviewStartDate?.trim() ? `Available From: ${form.availabilityInterviewStartDate.trim()}` : '',
    form.availabilityInterviewEndDate?.trim() ? `Available To: ${form.availabilityInterviewEndDate.trim()}` : '',
    form.interviewMode?.trim() ? `Interview Mode: ${form.interviewMode.trim()}` : ''
  ].filter(Boolean).join('\n')

const getNoticePeriodDays = (noticePeriod) => {
  const match = String(noticePeriod || '').match(/^(\d+)/)
  return match ? match[1] : ''
}

const dateInputToday = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

const calculateAgeFromDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return ''

  const birthDate = new Date(year, month - 1, day)
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return ''

  const today = new Date()
  if (birthDate > today) return ''

  let age = today.getFullYear() - year
  const birthdayThisYear = new Date(today.getFullYear(), month - 1, day)
  if (today < birthdayThisYear) age -= 1

  return age >= 0 ? String(age) : ''
}

const formatCurrentSalaryDetails = (form) =>
  [
    form.netInHandSalary?.trim() ? `NET / In-hand Salary: ${form.netInHandSalary.trim()}` : '',
    form.grossSalaryPerMonth?.trim() ? `Gross Per Month: ${form.grossSalaryPerMonth.trim()}` : '',
    form.ctcSalaryPerMonth?.trim() ? `CTC Per Month: ${form.ctcSalaryPerMonth.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatExpectedSalaryDetails = (form) =>
  [
    form.expectedNetInHandSalary?.trim() ? `Expected NET / In-hand Salary: ${form.expectedNetInHandSalary.trim()}` : '',
    form.expectedGrossSalaryPerMonth?.trim() ? `Expected Gross Per Month: ${form.expectedGrossSalaryPerMonth.trim()}` : '',
    form.expectedCtcSalaryPerMonth?.trim() ? `Expected CTC Per Month: ${form.expectedCtcSalaryPerMonth.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatKeyResponsibilities = (form) =>
  [
    form.keySkillsKnowledge?.trim() ? `Key Skills You Have: ${form.keySkillsKnowledge.trim()}` : '',
    form.careerJobResponsibilities?.trim() ? `Key Job Responsibility As Per Your Experience: ${form.careerJobResponsibilities.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatReferenceSuccessDetails = (sources, form) => {
  const sourceText = sources.length
    ? sources.map((source) => (source === 'Other' && form.referenceSourceOther?.trim() ? `Other: ${form.referenceSourceOther.trim()}` : source)).join(', ')
    : ''
  const profile = getSelectedOptionValue(form.referenceProfile, form.referenceProfileOther)

  return [
    sourceText ? `Reference Source: ${sourceText}` : '',
    profile ? `Reference Profile: ${profile}` : ''
  ].filter(Boolean).join('\n')
}

const getSubmitErrorMessage = (error) => {
  const serverMessage = error.response?.data?.message
  if (error.response?.status === 409) {
    return serverMessage || 'A candidate with this mobile number, email, or Aadhaar already exists.'
  }
  return serverMessage || 'Could not submit your application'
}

export default function StudentForm() {
  const navigate = useNavigate()
  const submitRequestedRef = useRef(false)
  const [advisorCode, setAdvisorCode] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [currentAddressParts, setCurrentAddressParts] = useState(() => createEmptyAddressParts())
  const [permanentAddressParts, setPermanentAddressParts] = useState(() => createEmptyAddressParts())
  const [instituteAddressParts, setInstituteAddressParts] = useState(() => createEmptyAddressParts())
  const [collegeAddressParts, setCollegeAddressParts] = useState(() => createEmptyAddressParts())
  const [referenceSuccessSources, setReferenceSuccessSources] = useState([])
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false)
  const [documents, setDocuments] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const currentStepConfig = formSteps[currentStep]
  const CurrentStepIcon = currentStepConfig.icon
  const isLastStep = currentStep === formSteps.length - 1
  const progress = Math.round(((currentStep + 1) / formSteps.length) * 100)

  const completedRequired = useMemo(
    () => requiredFields.filter((key) => form[key]?.trim()).length,
    [form]
  )

  const selectedDocumentCount = useMemo(
    () => Object.values(documents).reduce((total, files) => total + (files?.length || 0), 0),
    [documents]
  )

  const update = (field, value) => {
    if (submitError) setSubmitError('')
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
        ...(field === 'dateOfBirth' ? { currentAge: calculateAgeFromDate(value) } : {}),
        ...(field === 'siblingDateOfBirth' ? { siblingAge: calculateAgeFromDate(value) } : {})
      }

      if (field === 'siblingCareerProfile') {
        if (value !== 'Studying') {
          next.siblingStudyStandard = ''
          next.siblingStudyStandardOther = ''
        }
        if (value !== 'Other') {
          next.siblingCareerProfileOther = ''
        }
      }

      if (field === 'siblingStudyStandard' && value !== 'Other') {
        next.siblingStudyStandardOther = ''
      }

      if (field === 'currentJobLocation' && value !== 'Other') {
        next.currentJobLocationOther = ''
      }

      if (field === 'currentJobLocationMidcArea' && value !== 'Other') {
        next.currentJobLocationMidcAreaOther = ''
      }

      return next
    })
  }

  const updateCurrentAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setCurrentAddressParts((current) => ({ ...current, [field]: value }))
  }

  const updatePermanentAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setPermanentAddressParts((current) => ({ ...current, [field]: value }))
  }

  const updateInstituteAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setInstituteAddressParts((current) => ({ ...current, [field]: value }))
  }

  const updateCollegeAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setCollegeAddressParts((current) => ({ ...current, [field]: value }))
  }

  const toggleReferenceSuccessSource = (source) => {
    if (submitError) setSubmitError('')
    setReferenceSuccessSources((current) => {
      const nextSources = current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]

      if (source === 'Other' && !nextSources.includes('Other')) {
        setForm((formCurrent) => ({ ...formCurrent, referenceSourceOther: '' }))
      }

      return nextSources
    })
  }

  const normalizeFieldValue = (field, value) => {
    let next = value
    if (field.digitsOnly) next = next.replace(/\D/g, '')
    if (field.uppercase) next = next.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (field.maxLength) next = next.slice(0, field.maxLength)
    return next
  }

  const validateDocumentFile = (file, documentType) => {
    const allowedTypes = new Set(documentType.allowedTypes || Array.from(allowedDocumentImageTypes))
    if (!allowedTypes.has(file.type)) {
      toast.error(`${file.name} ${documentType.typeMessage || 'must be a JPG, PNG, or PDF file'}`)
      return false
    }

    if (file.size <= 0 || file.size > MAX_DOCUMENT_IMAGE_SIZE) {
      toast.error(`${file.name} must be 10MB or less`)
      return false
    }

    return true
  }

  const validatePersonalStep = () => {
    if (!form.candidateName.trim() || !form.mobileNumber.trim() || !form.emailId.trim()) {
      toast.error('Candidate name, mobile number, and email ID are required')
      return false
    }

    if (form.mobileNumber.trim().length !== 10) {
      toast.error('Mobile number must be 10 digits')
      return false
    }

    if (form.whatsappNo.trim() && form.whatsappNo.trim().length !== 10) {
      toast.error('WhatsApp number must be 10 digits')
      return false
    }

    if (!emailRegex.test(form.emailId.trim())) {
      toast.error('Enter a valid email ID')
      return false
    }

    if (form.aadhaarNo.trim() && form.aadhaarNo.trim().length !== 12) {
      toast.error('Aadhar card number must be 12 digits')
      return false
    }

    if (form.panNo.trim() && !panRegex.test(form.panNo.trim())) {
      toast.error('Enter a valid PAN number')
      return false
    }

    return true
  }

  const validatePhoneField = (fieldName, label) => {
    if (form[fieldName].trim() && form[fieldName].trim().length !== 10) {
      toast.error(`${label} must be 10 digits`)
      return false
    }
    return true
  }

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      return (
        validatePersonalStep() &&
        validatePhoneField('fatherMobileNumber', 'Father mobile number') &&
        validatePhoneField('motherMobileNumber', 'Mother mobile number') &&
        validatePhoneField('siblingMobileNumber', 'Sibling mobile number')
      )
    }
    if (currentStep === 1) {
      return (
        validatePhoneField('professorContactNumber', 'Institute mobile number') &&
        validatePhoneField('collegeMobileNumber', 'College mobile number')
      )
    }
    if (currentStep === 3) {
      return validatePhoneField('referenceContactNumber', 'Reference mobile number')
    }
    return true
  }

  const validateBeforeSubmit = () => {
    if (!validatePersonalStep()) return false
    if (!validatePhoneField('professorContactNumber', 'Institute mobile number')) return false
    if (!validatePhoneField('collegeMobileNumber', 'College mobile number')) return false
    if (!validatePhoneField('referenceContactNumber', 'Reference mobile number')) return false
    if (!validatePhoneField('fatherMobileNumber', 'Father mobile number')) return false
    if (!validatePhoneField('motherMobileNumber', 'Mother mobile number')) return false
    if (!validatePhoneField('siblingMobileNumber', 'Sibling mobile number')) return false

    return true
  }

  const goToStep = (step) => {
    if (step > currentStep && !validateCurrentStep()) return
    setCurrentStep(step)
  }

  const goNext = () => {
    if (!validateCurrentStep()) return
    setCurrentStep((step) => Math.min(step + 1, formSteps.length - 1))
  }

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const addDocumentFiles = (documentType, fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    if (submitError) setSubmitError('')
    setDocuments((current) => {
      const currentFiles = current[documentType.key] || []
      const validFiles = files.filter((item) => validateDocumentFile(item, documentType))
      if (!validFiles.length) return current

      if (currentFiles.length + validFiles.length > MAX_DOCUMENT_FILES_PER_TYPE) {
        toast.error(`Upload up to ${MAX_DOCUMENT_FILES_PER_TYPE} files for ${documentType.label}`)
        return current
      }

      return {
        ...current,
        [documentType.key]: [...currentFiles, ...validFiles]
      }
    })
  }

  const removeDocumentFile = (documentKey, index) => {
    setDocuments((current) => {
      const nextFiles = (current[documentKey] || []).filter((_, itemIndex) => itemIndex !== index)
      const next = { ...current }
      if (nextFiles.length) {
        next[documentKey] = nextFiles
      } else {
        delete next[documentKey]
      }
      return next
    })
  }

  const uploadSelectedDocuments = async (candidateId) => {
    const entries = Object.entries(documents).filter(([, files]) => files?.length)
    if (!entries.length || !candidateId) return 0

    const payload = new FormData()
    entries.forEach(([documentKey, files]) => {
      files.forEach((file) => {
        payload.append('documents', file)
        payload.append('documentTypes', documentKey)
      })
    })

    await api.post(`/students/${candidateId}/docs`, payload)
    return entries.reduce((total, [, files]) => total + files.length, 0)
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!submitRequestedRef.current) {
      return
    }
    submitRequestedRef.current = false

    if (!validateBeforeSubmit()) {
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const effectiveCurrentAddressParts = sameAsCurrentAddress ? permanentAddressParts : currentAddressParts
      const currentAddress = formatAddressParts(effectiveCurrentAddressParts)
      const permanentAddress = formatAddressParts(permanentAddressParts)
      const instituteAddress = formatAddressParts(instituteAddressParts)
      const collegeAddress = formatAddressParts(collegeAddressParts)
      const instituteReferenceDetails = formatInstituteReferenceDetails(form, instituteAddress)
      const instituteCollegeDetails = formatInstituteCollegeDetails(form, collegeAddress)
      const referenceSuccessDetails = formatReferenceSuccessDetails(referenceSuccessSources, form)
      const applicationDetails = {
        personal: {
          candidateName: form.candidateName,
          mobileNumber: form.mobileNumber,
          whatsappNo: form.whatsappNo,
          emailId: form.emailId,
          gender: form.gender,
          currentAge: form.currentAge,
          marriageStatus: form.marriageStatus,
          aadhaarNo: form.aadhaarNo,
          panNo: form.panNo,
          dateOfBirth: form.dateOfBirth,
          currentAddress: effectiveCurrentAddressParts,
          permanentAddress: permanentAddressParts,
          sameAsCurrentAddress,
          familyDetails: {
            fatherOrHusbandName: form.fatherOrHusbandName,
            fatherOccupation: form.fatherOccupation,
            fatherMobileNumber: form.fatherMobileNumber,
            motherOrWifeName: form.motherOrWifeName,
            motherOccupation: form.motherOccupation,
            motherMobileNumber: form.motherMobileNumber,
            siblingName: form.siblingName,
            siblingEducation: form.siblingEducation,
            siblingMobileNumber: form.siblingMobileNumber,
            siblingDateOfBirth: form.siblingDateOfBirth,
            siblingAge: form.siblingAge,
            siblingGender: form.siblingGender,
            siblingCareerProfile: form.siblingCareerProfile,
            siblingStudyStandard: form.siblingCareerProfile === 'Studying' ? form.siblingStudyStandard : '',
            siblingStudyStandardOther: form.siblingCareerProfile === 'Studying' && form.siblingStudyStandard === 'Other' ? form.siblingStudyStandardOther : '',
            siblingCareerProfileOther: form.siblingCareerProfile === 'Other' ? form.siblingCareerProfileOther : ''
          }
        },
        education: {
          educationSector: form.educationSector,
          educationSectorOther: form.educationSectorOther,
          highestEducation: getSelectedOptionValue(form.educationSector, form.educationSectorOther),
          yearOfHigherEducation: form.yearOfHigherEducation,
          educationBranch: form.educationBranch,
          educationBranchOther: form.educationBranchOther,
          branch: getSelectedOptionValue(form.educationBranch, form.educationBranchOther),
          educationSpecialization: form.educationSpecialization,
          educationSpecializationOther: form.educationSpecializationOther,
          specialization: getSelectedOptionValue(form.educationSpecialization, form.educationSpecializationOther),
          computerCourse: form.computerCourse,
          computerCourseOther: form.computerCourseOther,
          certificationCourse: form.certificationCourse,
          certificationCourseOther: form.certificationCourseOther,
          instituteReference: {
            instituteName: form.collegeName,
            representativeName: form.professorName,
            designation: form.instituteDesignation,
            mobileNumber: form.professorContactNumber,
            address: instituteAddressParts
          },
          instituteCollege: {
            college12GraduateName: form.college12GraduateName,
            postGraduateCollegeName: form.postGraduateCollegeName,
            teacherName: form.collegeTeacherName,
            designation: form.collegeDesignation,
            mobileNumber: form.collegeMobileNumber,
            reference: form.collegeReference,
            address: collegeAddressParts
          }
        },
        professional: {
          preferredDepartment: form.interestedDepartment,
          preferredIndustry: getSelectedOptionValue(form.preferredIndustry, form.preferredIndustryOther),
          preferredIndustryRaw: form.preferredIndustry,
          preferredIndustryOther: form.preferredIndustryOther,
          industrySpecialization: getSelectedOptionValue(form.industrySpecialization, form.industrySpecializationOther),
          industrySpecializationRaw: form.industrySpecialization,
          industrySpecializationOther: form.industrySpecializationOther,
          currentSalary: {
            netInHand: form.netInHandSalary,
            grossPerMonth: form.grossSalaryPerMonth,
            ctcPerMonth: form.ctcSalaryPerMonth
          },
          expectedSalary: {
            netInHand: form.expectedNetInHandSalary,
            grossPerMonth: form.expectedGrossSalaryPerMonth,
            ctcPerMonth: form.expectedCtcSalaryPerMonth
          },
          currentJobLocation: form.currentJobLocation,
          currentJobLocationOther: form.currentJobLocation === 'Other' ? form.currentJobLocationOther : '',
          currentJobLocationMidcArea: form.currentJobLocationMidcArea,
          currentJobLocationMidcAreaOther: form.currentJobLocationMidcArea === 'Other' ? form.currentJobLocationMidcAreaOther : '',
          preferredJobLocation: form.preferredJobLocation,
          jobWorkingStatus: form.jobWorkingStatus,
          experienceType: form.experienceType,
          totalExperience: form.experienceType === 'Fresher' ? '0' : form.totalExperience,
          noticePeriod: getSelectedOptionValue(form.noticePeriod, form.noticePeriodOther),
          noticePeriodRaw: form.noticePeriod,
          noticePeriodOther: form.noticePeriodOther,
          availabilityForInterview: formatInterviewAvailability(form),
          availabilityInterviewStartDate: form.availabilityInterviewStartDate,
          availabilityInterviewEndDate: form.availabilityInterviewEndDate,
          interviewMode: form.interviewMode,
          reasonForJobChange: getSelectedOptionValue(form.reasonForJobChange, form.reasonForJobChangeOther),
          reasonForJobChangeRaw: form.reasonForJobChange,
          reasonForJobChangeOther: form.reasonForJobChangeOther,
          keySkillsKnowledge: form.keySkillsKnowledge,
          careerJobResponsibilities: form.careerJobResponsibilities
        },
        referenceSuccess: {
          advisorCode: advisorCode.trim().toLowerCase(),
          referenceName: form.referenceBy,
          referenceMobileNumber: form.referenceContactNumber,
          referenceProfile: getSelectedOptionValue(form.referenceProfile, form.referenceProfileOther),
          referenceProfileRaw: form.referenceProfile,
          referenceProfileOther: form.referenceProfileOther,
          referenceSources: referenceSuccessSources,
          referenceSourceOther: referenceSuccessSources.includes('Other') ? form.referenceSourceOther : ''
        }
      }
      const preparedForm = {
        ...form,
        siblingStudyStandard: form.siblingCareerProfile === 'Studying' ? form.siblingStudyStandard : '',
        siblingStudyStandardOther: form.siblingCareerProfile === 'Studying' && form.siblingStudyStandard === 'Other' ? form.siblingStudyStandardOther : '',
        siblingCareerProfileOther: form.siblingCareerProfile === 'Other' ? form.siblingCareerProfileOther : '',
        currentJobLocationOther: form.currentJobLocation === 'Other' ? form.currentJobLocationOther : '',
        currentJobLocationMidcAreaOther: form.currentJobLocationMidcArea === 'Other' ? form.currentJobLocationMidcAreaOther : '',
        professorName: referenceSuccessDetails,
        professorContactNumber: '',
        currentAddress,
        permanentAddress,
        education: formatEducationDetails(form),
        computerCourses: formatComputerCourses(form),
        interestedDepartment: form.interestedDepartment,
        preferredIndustry: getSelectedOptionValue(form.preferredIndustry, form.preferredIndustryOther),
        careerSummary: formatCareerSummary(form),
        totalExperience: form.experienceType === 'Fresher' ? '0' : form.totalExperience,
        noticePeriod: getNoticePeriodDays(form.noticePeriod),
        availabilityForInterview: formatInterviewAvailability(form),
        interviewMode: form.interviewMode,
        currentSalary: formatCurrentSalaryDetails(form),
        expectedSalary: formatExpectedSalaryDetails(form),
        keyResponsibilities: formatKeyResponsibilities(form),
        reasonForJobChange: getSelectedOptionValue(form.reasonForJobChange, form.reasonForJobChangeOther),
        otherAchievements: [instituteReferenceDetails, instituteCollegeDetails].filter(Boolean).join('\n\n')
      }

      const payload = {
        ...preparedForm,
        applicationDetails,
        advisorCode: advisorCode.trim().toLowerCase() || undefined
      }

      const { data } = await api.post('/students', payload)

      if (selectedDocumentCount) {
        try {
          const uploadedCount = await uploadSelectedDocuments(data._id)
          toast.success(`Candidate reference submitted with ${uploadedCount} document${uploadedCount === 1 ? '' : 's'}.`)
        } catch (uploadError) {
          toast.error(uploadError.response?.data?.message || 'Candidate saved, but document upload failed')
        }
      } else {
        toast.success('Candidate reference submitted successfully.')
      }

      navigate('/ba/students')
    } catch (error) {
      const message = getSubmitErrorMessage(error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicShell>
      <form onSubmit={submit} className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <WizardSidebar
          currentStep={currentStep}
          progress={progress}
          completedRequired={completedRequired}
          advisorCode={advisorCode}
          selectedDocumentCount={selectedDocumentCount}
          onStep={goToStep}
        />

        <div className="min-w-0 space-y-4">
          <MobileProgress currentStep={currentStep} progress={progress} />

          {submitError ? (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{submitError}</p>
            </div>
          ) : null}

          <section className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <CurrentStepIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-sky-700">Step {currentStep + 1} of {formSteps.length}</p>
                  <h2 className="mt-0.5 text-lg font-bold leading-7 text-slate-950 sm:text-xl">{currentStepConfig.title}</h2>
                </div>
              </div>
            </header>

            <div className="px-4 py-5 sm:px-6">
              {currentStep === 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {personalFields.slice(0, 4).map((field) => (
                      <Field key={field.name} field={field} value={form[field.name]} onChange={(value) => update(field.name, normalizeFieldValue(field, value))} />
                    ))}
                    <SelectField label="Gender" value={form.gender} onChange={(value) => update('gender', value)} options={['', 'Male', 'Female', 'Other']} />
                    {personalFields.slice(4, 8).map((field) => (
                      <Field key={field.name} field={field} value={form[field.name]} onChange={(value) => update(field.name, normalizeFieldValue(field, value))} />
                    ))}
                    <SelectField label="Marital Status" value={form.marriageStatus} onChange={(value) => update('marriageStatus', value)} options={['', 'Married', 'Unmarried', 'Single', 'Widow']} />
                  </div>

                  <AddressSection
                    title="Permanent Address"
                    values={permanentAddressParts}
                    onChange={updatePermanentAddressPart}
                  />

                  <AddressSection
                    title="Current Address"
                    values={sameAsCurrentAddress ? permanentAddressParts : currentAddressParts}
                    onChange={updateCurrentAddressPart}
                    disabled={sameAsCurrentAddress}
                    action={(
                      <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={sameAsCurrentAddress}
                          onChange={(event) => {
                            if (submitError) setSubmitError('')
                            setSameAsCurrentAddress(event.target.checked)
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Same as permanent address
                      </label>
                    )}
                  />

                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">Family Details</h3>
                    <FieldGrid fields={familyFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} />
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <EducationDetails
                  form={form}
                  update={update}
                  normalizeFieldValue={normalizeFieldValue}
                  instituteAddressParts={instituteAddressParts}
                  updateInstituteAddressPart={updateInstituteAddressPart}
                  collegeAddressParts={collegeAddressParts}
                  updateCollegeAddressPart={updateCollegeAddressPart}
                />
              ) : null}

              {currentStep === 2 ? <ProfessionalDetails form={form} update={update} normalizeFieldValue={normalizeFieldValue} /> : null}

              {currentStep === 3 ? (
                <ReferenceSuccessDetails
                  form={form}
                  update={update}
                  normalizeFieldValue={normalizeFieldValue}
                  selectedSources={referenceSuccessSources}
                  onToggleSource={toggleReferenceSuccessSource}
                  advisorCode={advisorCode}
                  setAdvisorCode={setAdvisorCode}
                />
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                      <FileImage className="h-4 w-4 text-sky-700" />
                      Upload Document
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {resumeCandidateDocumentType ? (
                        <DocumentUpload
                          key={resumeCandidateDocumentType.key}
                          documentType={resumeCandidateDocumentType}
                          files={documents[resumeCandidateDocumentType.key] || []}
                          onFiles={(files) => addDocumentFiles(resumeCandidateDocumentType, files)}
                          onRemove={(index) => removeDocumentFile(resumeCandidateDocumentType.key, index)}
                        />
                      ) : null}
                      <EducationCertificateUploadGroup
                        documents={documents}
                        addDocumentFiles={addDocumentFiles}
                        removeDocumentFile={removeDocumentFile}
                      />
                      <ComputerCourseUploadGroup
                        documents={documents}
                        addDocumentFiles={addDocumentFiles}
                        removeDocumentFile={removeDocumentFile}
                      />
                      {otherCandidateDocumentTypes.map((documentType) => (
                        <DocumentUpload
                          key={documentType.key}
                          documentType={documentType}
                          files={documents[documentType.key] || []}
                          onFiles={(files) => addDocumentFiles(documentType, files)}
                          onRemove={(index) => removeDocumentFile(documentType.key, index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="sticky bottom-3 z-20 rounded-lg bg-white/95 p-3 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 backdrop-blur sm:static sm:shadow-sm">
            <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0 || submitting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {isLastStep ? (
                <button
                  type="submit"
                  onClick={() => {
                    submitRequestedRef.current = true
                  }}
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70 sm:min-w-56"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70 sm:min-w-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </PublicShell>
  )
}

const inputClassName = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-cyan-100'

function PublicShell({ children }) {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-950 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-lg bg-white px-2 py-3 shadow-sm ring-1 ring-slate-200 sm:mb-5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
              <img src="/success-logo.svg" alt="SUCCESS HR Solution" className="h-8 w-20 shrink-0 object-contain sm:h-14 sm:w-48" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xs font-bold leading-4 text-slate-950 sm:text-2xl sm:leading-8">Candidate Job Application Form</h1>
              </div>
            </div>
            <span className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">Secure form</span>
          </div>
        </header>

        {children}

        <footer className="py-7 text-center text-xs font-semibold text-slate-500">Powered by SUCCESS HR Solution</footer>
      </div>
    </main>
  )
}

function WizardSidebar({ currentStep, progress, completedRequired, advisorCode, selectedDocumentCount, onStep }) {
  return (
    <aside className="hidden h-fit rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-5 lg:block">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="space-y-1">
        {formSteps.map((step, index) => {
          const StepIcon = step.icon
          const active = index === currentStep
          const complete = index < currentStep

          return (
            <button
              key={step.title}
              type="button"
              onClick={() => onStep(index)}
              className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                active
                  ? 'bg-sky-600 text-white'
                  : complete
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-white/15' : 'bg-white ring-1 ring-slate-200'}`}>
                <StepIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 leading-5">{step.title}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
        <SummaryRow label="Required" value={`${completedRequired}/${requiredFields.length}`} />
        <SummaryRow label="Reference" value={advisorCode.trim() ? advisorCode.trim() : 'Walk-in'} />
        <SummaryRow label="Resume" value={selectedDocumentCount ? 'Selected' : 'Optional'} />
      </div>
    </aside>
  )
}

function MobileProgress({ currentStep, progress }) {
  const StepIcon = formSteps[currentStep].icon

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <StepIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-sky-700">Step {currentStep + 1} of {formSteps.length}</p>
            <p className="truncate text-sm font-bold text-slate-950">{formSteps[currentStep].title}</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-500">{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function ProfessionalDetails({ form, update, normalizeFieldValue }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-4 text-sm font-bold text-slate-800">Preferred Department</h3>
        <div className="grid gap-4">
          <SelectField
            label="Preferred Department"
            value={form.interestedDepartment}
            onChange={(value) => update('interestedDepartment', value)}
            options={preferredDepartmentOptions}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Preferred Industry</h3>
        <div className="grid gap-4">
          <SelectField
            label="Preferred Industry"
            value={form.preferredIndustry}
            onChange={(value) => update('preferredIndustry', value)}
            options={preferredIndustryOptions}
          />
          {form.preferredIndustry === 'Other' ? (
            <Field
              field={{ name: 'preferredIndustryOther', label: 'Other Preferred Industry' }}
              value={form.preferredIndustryOther}
              onChange={(value) => update('preferredIndustryOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Industry Specialization</h3>
        <div className="grid gap-4">
          <SelectField
            label="Industry Specialization"
            value={form.industrySpecialization}
            onChange={(value) => update('industrySpecialization', value)}
            options={industrySpecializationOptions}
          />
          {form.industrySpecialization === 'Other' ? (
            <Field
              field={{ name: 'industrySpecializationOther', label: 'Other Industry Specialization' }}
              value={form.industrySpecializationOther}
              onChange={(value) => update('industrySpecializationOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Expected Salary Per Month</h3>
        <FieldGrid fields={expectedSalaryFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Current Salary Per Month</h3>
        <FieldGrid fields={currentSalaryFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Job Working Status</h3>
        <div className="grid gap-4">
          <SelectField
            label="Job Working Status"
            value={form.jobWorkingStatus}
            onChange={(value) => update('jobWorkingStatus', value)}
            options={jobWorkingStatusOptions}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Total Years of Experience</h3>
        <div className="grid gap-4">
          <SelectField
            label="Experience Type"
            value={form.experienceType}
            onChange={(value) => {
              update('experienceType', value)
              if (value === 'Fresher') update('totalExperience', '')
            }}
            options={experienceTypeOptions}
          />
          {form.experienceType === 'Experience' ? (
            <Field
              field={{ name: 'totalExperience', label: 'Enter Total Year of Experience', type: 'number' }}
              value={form.totalExperience}
              onChange={(value) => update('totalExperience', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Notice Period</h3>
        <div className="grid gap-4">
          <SelectField
            label="Notice Period"
            value={form.noticePeriod}
            onChange={(value) => update('noticePeriod', value)}
            options={noticePeriodOptions}
          />
          {form.noticePeriod === 'Other' ? (
            <Field
              field={{ name: 'noticePeriodOther', label: 'Other Notice Period', placeholder: 'Enter in days or month' }}
              value={form.noticePeriodOther}
              onChange={(value) => update('noticePeriodOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Availability for Interview</h3>
        <div className="grid gap-4">
          <Field
            field={{ name: 'availabilityInterviewStartDate', label: 'Available From', type: 'date', maxToday: false }}
            value={form.availabilityInterviewStartDate}
            onChange={(value) => update('availabilityInterviewStartDate', value)}
          />
          <Field
            field={{ name: 'availabilityInterviewEndDate', label: 'Available To', type: 'date', maxToday: false }}
            value={form.availabilityInterviewEndDate}
            onChange={(value) => update('availabilityInterviewEndDate', value)}
          />
          <SelectField
            label="Interview Mode"
            value={form.interviewMode}
            onChange={(value) => update('interviewMode', value)}
            options={interviewModeOptions}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Reason for Job Change</h3>
        <div className="grid gap-4">
          <SelectField
            label="Reason for Job Change"
            value={form.reasonForJobChange}
            onChange={(value) => update('reasonForJobChange', value)}
            options={reasonForJobChangeOptions}
          />
          {form.reasonForJobChange === 'Any Other' ? (
            <Field
              field={{ name: 'reasonForJobChangeOther', label: 'Other Reason' }}
              value={form.reasonForJobChangeOther}
              onChange={(value) => update('reasonForJobChangeOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Key Skills You Have</h3>
        <Field
          field={{ name: 'keySkillsKnowledge', label: 'Key skills you have', kind: 'area' }}
          value={form.keySkillsKnowledge}
          onChange={(value) => update('keySkillsKnowledge', value)}
        />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Key Job Responsibility As Per Your Experience</h3>
        <Field
          field={{ name: 'careerJobResponsibilities', label: 'Key job responsibility as per your experience', kind: 'area' }}
          value={form.careerJobResponsibilities}
          onChange={(value) => update('careerJobResponsibilities', value)}
        />
      </div>

    </div>
  )
}

function ReferenceSuccessDetails({ form, update, normalizeFieldValue, selectedSources, onToggleSource, advisorCode, setAdvisorCode }) {
  const referenceMobileField = {
    name: 'referenceContactNumber',
    label: 'Reference Mobile Number',
    inputMode: 'numeric',
    maxLength: 10,
    digitsOnly: true
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-bold text-slate-800">Reference Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            field={{ name: 'referenceBy', label: 'Reference Name' }}
            value={form.referenceBy}
            onChange={(value) => update('referenceBy', value)}
          />
          <Field
            field={referenceMobileField}
            value={form.referenceContactNumber}
            onChange={(value) => update('referenceContactNumber', normalizeFieldValue(referenceMobileField, value))}
          />
          <SelectField
            label="Reference Profile"
            value={form.referenceProfile}
            onChange={(value) => update('referenceProfile', value)}
            options={referenceProfileOptions}
          />
          {form.referenceProfile === 'Other' ? (
            <Field
              field={{ name: 'referenceProfileOther', label: 'Other Reference Profile' }}
              value={form.referenceProfileOther}
              onChange={(value) => update('referenceProfileOther', value)}
            />
          ) : null}
          <label className="block text-sm font-semibold leading-5 text-slate-700">
            Business Advisor Code
            <input
              value={advisorCode}
              onChange={(event) => setAdvisorCode(String(event.target.value || '').trim().toLowerCase())}
              className={inputClassName}
            />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Reference Source</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {referenceSourceOptions.map((source) => (
            <label
              key={source}
              className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                checked={selectedSources.includes(source)}
                onChange={() => onToggleSource(source)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              {source}
            </label>
          ))}
        </div>
        {selectedSources.includes('Other') ? (
          <div className="mt-4">
            <Field
              field={{ name: 'referenceSourceOther', label: 'Other Reference Source' }}
              value={form.referenceSourceOther}
              onChange={(value) => update('referenceSourceOther', value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AddressSection({ title, values, onChange, disabled = false, action = null }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {action}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {addressPartFields.map((field) => (
          <label key={field.name} className="block min-w-0 text-sm font-semibold leading-5 text-slate-700">
            <span className="break-words">{field.label}</span>
            <input
              type="text"
              value={values[field.name] || ''}
              disabled={disabled}
              onChange={(event) => onChange(field.name, event.target.value)}
              className={`${inputClassName} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function EducationDetails({
  form,
  update,
  normalizeFieldValue,
  instituteAddressParts,
  updateInstituteAddressPart,
  collegeAddressParts,
  updateCollegeAddressPart
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-4 text-sm font-bold text-slate-800">Highest Education Like Graduate, Post Graduate</h3>
        <div className="grid gap-4">
            <SelectField
              label="Highest Education Like Graduate, Post Graduate"
              value={form.educationSector}
              onChange={(value) => update('educationSector', value)}
              options={educationSectorOptions}
            />
            <SelectField
              label="Passing Year of Education"
              value={form.yearOfHigherEducation}
              onChange={(value) => update('yearOfHigherEducation', value)}
              options={higherEducationYearOptions}
            />
            {form.educationSector === 'Other' ? (
              <Field
                field={{ name: 'educationSectorOther', label: 'Other Education Sector' }}
                value={form.educationSectorOther}
                onChange={(value) => update('educationSectorOther', value)}
              />
            ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Education Branch</h3>
        <div className="space-y-4">
            <SelectField
              label="Branch"
              value={form.educationBranch}
              onChange={(value) => update('educationBranch', value)}
              options={educationBranchOptions}
            />
            {form.educationBranch === 'Other' ? (
              <Field
                field={{ name: 'educationBranchOther', label: 'Mention Your Other Branch' }}
                value={form.educationBranchOther}
                onChange={(value) => update('educationBranchOther', value)}
              />
            ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Education Specialization</h3>
        <div className="space-y-4">
            <SelectField
              label="Special Subject / Remark"
              value={form.educationSpecialization}
              onChange={(value) => update('educationSpecialization', value)}
              options={educationSpecializationOptions}
            />
            {form.educationSpecialization === 'Other' ? (
              <Field
                field={{ name: 'educationSpecializationOther', label: 'Other Special Subject' }}
                value={form.educationSpecializationOther}
                onChange={(value) => update('educationSpecializationOther', value)}
              />
            ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Other Computer Class Or Certification Details</h3>
        <div className="grid gap-4">
          <SelectField
            label="Computer Courses"
            value={form.computerCourse}
            onChange={(value) => update('computerCourse', value)}
            options={computerCourseOptions}
          />
          <SelectField
            label="Other Certification Courses"
            value={form.certificationCourse}
            onChange={(value) => update('certificationCourse', value)}
            options={certificationCourseOptions}
          />
          {form.computerCourse === 'Other' ? (
            <Field
              field={{ name: 'computerCourseOther', label: 'Other Computer Course' }}
              value={form.computerCourseOther}
              onChange={(value) => update('computerCourseOther', value)}
            />
          ) : null}
          {form.certificationCourse === 'Other' ? (
            <Field
              field={{ name: 'certificationCourseOther', label: 'Other Certification Course' }}
              value={form.certificationCourseOther}
              onChange={(value) => update('certificationCourseOther', value)}
            />
          ) : null}
        </div>
      </div>

      <InstituteReferenceDetails
        form={form}
        update={update}
        normalizeFieldValue={normalizeFieldValue}
        addressParts={instituteAddressParts}
        onAddressChange={updateInstituteAddressPart}
      />

      <InstituteCollegeDetails
        form={form}
        update={update}
        normalizeFieldValue={normalizeFieldValue}
        addressParts={collegeAddressParts}
        onAddressChange={updateCollegeAddressPart}
      />
    </div>
  )
}

function InstituteReferenceDetails({ form, update, normalizeFieldValue, addressParts, onAddressChange }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-sm font-bold text-slate-800">Institute Reference Details</h3>
      <FieldGrid fields={instituteReferenceFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />

      <div className="mt-5">
        <h4 className="mb-4 text-sm font-bold text-slate-800">Institute Address</h4>
        <div className="grid gap-4">
          {addressPartFields.map((field) => (
            <label key={field.name} className="block min-w-0 text-sm font-semibold leading-5 text-slate-700">
              <span className="break-words">{field.label}</span>
              <input
                type="text"
                value={addressParts[field.name] || ''}
                onChange={(event) => onAddressChange(field.name, event.target.value)}
                className={inputClassName}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function InstituteCollegeDetails({ form, update, normalizeFieldValue, addressParts, onAddressChange }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-sm font-bold text-slate-800">Institute Details</h3>
      <FieldGrid fields={instituteCollegeFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />

      <div className="mt-5">
        <h4 className="mb-4 text-sm font-bold text-slate-800">College Address</h4>
        <div className="grid gap-4">
          {addressPartFields.map((field) => (
            <label key={field.name} className="block min-w-0 text-sm font-semibold leading-5 text-slate-700">
              <span className="break-words">{field.label}</span>
              <input
                type="text"
                value={addressParts[field.name] || ''}
                onChange={(event) => onAddressChange(field.name, event.target.value)}
                className={inputClassName}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function FieldGrid({ fields, form, update, normalizeFieldValue, singleColumn = false }) {
  const visibleFields = fields.filter((field) => !field.showWhen || form[field.showWhen.name] === field.showWhen.value)

  return (
    <div className={`grid gap-4 ${singleColumn ? '' : 'md:grid-cols-2'}`}>
      {visibleFields.map((field) => (
        <Field
          key={field.name}
          field={field}
          value={form[field.name]}
          onChange={(value) => update(field.name, normalizeFieldValue(field, value))}
        />
      ))}
    </div>
  )
}

function Field({ field, value, onChange }) {
  return (
    <label className={`block min-w-0 text-sm font-semibold leading-5 text-slate-700 ${field.kind === 'area' ? 'md:col-span-2' : ''}`}>
      <span className="break-words">
        {field.label} {field.required ? <span className="text-rose-500">*</span> : null}
      </span>
      {field.kind === 'area' ? (
        <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} resize-y`} />
      ) : field.options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
          {field.options.map((option) => (
            <option key={option || 'empty'} value={option}>
              {option || 'Select'}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type || 'text'}
          value={value}
          required={field.required}
          min={field.type === 'number' ? '0' : undefined}
          max={field.type === 'date' && field.maxToday !== false ? dateInputToday() : undefined}
          inputMode={field.inputMode}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName} ${field.readOnly ? 'bg-slate-50 text-slate-600' : ''}`}
        />
      )}
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0 text-sm font-semibold leading-5 text-slate-700">
      <span className="break-words">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
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

function EducationCertificateUploadGroup({ documents, addDocumentFiles, removeDocumentFile }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-4 md:col-span-2 xl:col-span-3">
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-900">Education Certificates</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Upload level-wise certificates like 10th, 12th, Graduate, and Post Graduate.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {educationCertificateDocumentTypes.map((documentType) => (
          <DocumentUpload
            key={documentType.key}
            documentType={documentType}
            label={educationCertificateLabel(documentType)}
            files={documents[documentType.key] || []}
            onFiles={(files) => addDocumentFiles(documentType, files)}
            onRemove={(index) => removeDocumentFile(documentType.key, index)}
          />
        ))}
      </div>
    </div>
  )
}

function ComputerCourseUploadGroup({ documents, addDocumentFiles, removeDocumentFile }) {
  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-4 md:col-span-2 xl:col-span-3">
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-900">Computer Courses Certificates</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Upload course-wise certificates like MS-CIT, CCC, Advanced Excel, Tally, AutoCAD, Typing, and CATIA.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {computerCourseDocumentTypes.map((documentType) => (
          <DocumentUpload
            key={documentType.key}
            documentType={documentType}
            files={documents[documentType.key] || []}
            onFiles={(files) => addDocumentFiles(documentType, files)}
            onRemove={(index) => removeDocumentFile(documentType.key, index)}
          />
        ))}
      </div>
    </div>
  )
}

function DocumentUpload({ documentType, label, files, onFiles, onRemove }) {
  const inputId = `document-${documentType.key}`
  const inputRef = useRef(null)

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <label htmlFor={inputId} className="block text-sm font-bold text-slate-900">
            {label || documentType.label}
          </label>
          <p className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG, or PDF up to 10MB</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-3 text-sm font-bold text-sky-700 hover:bg-sky-50"
        >
          <UploadCloud className="h-4 w-4" />
          Upload
        </button>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={documentType.accept || 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf'}
        className="sr-only"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation()
          onFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {files.length ? (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 ring-1 ring-slate-200">
              <span className="min-w-0 truncate text-xs font-semibold text-slate-700">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Remove ${documentType.label}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span>{label}</span>
      <span className="max-w-32 truncate text-right font-semibold text-slate-950">{value || '-'}</span>
    </div>
  )
}
