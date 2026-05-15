export const RATING_VALUES = [1, 2, 3, 4, 5]
export const IQ_TQ_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const DIRECTOR_RATING_VALUES = ['Low', 'Medium', 'High']
export const DIRECTOR_YES_NO_VALUES = ['Yes', 'No']
export const DIRECTOR_MODE_VALUES = ['Online', 'Offline']
export const QUESTION_CHOICES = ['A', 'B', 'C']
export const INTERVIEW_QUESTION_COUNT = 10
export const QUESTION_MARK_MAX = 10

export const PROFESSIONAL_RATING_FIELDS = [
  { key: 'qualification', label: 'Qualification' },
  { key: 'technicalKnowledge', label: 'Technical Knowledge' },
  { key: 'professionalExperience', label: 'Professional Experience' },
  { key: 'competenceConfidence', label: 'Competence / Confidence' },
  { key: 'maturity', label: 'Maturity' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'communicationEngMar', label: 'Communication - Eng / Mar' },
  { key: 'stability', label: 'Stability' }
]

export const PERSONALITY_RATING_FIELDS = [
  { key: 'leadership', label: 'Leadership' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'interpersonalSkills', label: 'Interpersonal Skills' },
  { key: 'enthusiasm', label: 'Enthusiasm' },
  { key: 'intelligenceAlertness', label: 'Intelligence / Alertness' },
  { key: 'personalityHonesty', label: 'Personality / Honesty' },
  { key: 'financeStandard', label: 'Finance Standard' },
  { key: 'classOfCandidate', label: 'Class Of Candidate' }
]

export const DIRECTOR_ASSESSMENT_FIELDS = [
  { key: 'classOfCandidate', label: 'Class Of Candidate' },
  { key: 'priorityOfCandidate', label: 'Priority Of Candidate' }
]

export const MANAGER_ASSESSMENT_FIELDS = [
  { key: 'classOfCandidate', label: 'Class Of Candidate' },
  { key: 'priorityOfCandidate', label: 'Priority Of Candidate' }
]

export const SUCCESS_INFO_FIELDS = [
  { key: 'numberSave', label: 'Number Save', options: ['', 'Yes', 'No'] },
  { key: 'groupJoin', label: 'Group Join', options: ['', 'Yes', 'No'] },
  { key: 'byWhichStaff', label: 'By Which Staff' },
  { key: 'candidateClass', label: 'Class Of Candidate' },
  { key: 'relation', label: 'Relation' },
  { key: 'reference', label: 'Reference' },
  { key: 'referenceMobileNo', label: 'Reference Mobile No' },
  { key: 'whatsappChannelCommunity', label: 'WhatsApp Channel / Community', options: ['', 'Yes', 'No'] },
  { key: 'candidateRegistrationStatus', label: 'Candidate Registration Status', options: ['', 'Registered Candidate', 'Non Registered Candidate'] },
  { key: 'candidateDataSource', label: 'Candidates Data (College/Institute/Company)' },
  { key: 'googleForm', label: 'Google Form' },
  { key: 'justDialGoogleFeedback', label: 'Just Dial / Google Feedback' },
  { key: 'hrContactDetails', label: 'HR Contact Details' }
]

const text = (value) => String(value ?? '')

const dateInput = (value) => (value ? String(value).slice(0, 10) : '')

const addressPartKeys = ['village', 'taluka', 'district', 'state']

const parseAddressParts = (value) => {
  if (value && typeof value === 'object') {
    return addressPartKeys.reduce((acc, key) => {
      acc[key] = text(value[key]).trim()
      return acc
    }, {})
  }

  const raw = text(value).trim()
  const parts = addressPartKeys.reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {})

  if (!raw) return parts

  const labels = {
    village: 'Village',
    taluka: 'Taluka',
    district: 'District',
    state: 'State'
  }

  addressPartKeys.forEach((key) => {
    const match = raw.match(new RegExp(`${labels[key]}\\s*:\\s*([^,]+)`, 'i'))
    if (match) parts[key] = text(match[1]).trim()
  })

  if (!Object.values(parts).some(Boolean)) {
    parts.village = raw
  }

  return parts
}

const formatAddressParts = (form, prefix, fallback = '') => {
  const labels = {
    village: 'Village',
    taluka: 'Taluka',
    district: 'District',
    state: 'State'
  }
  const formatted = addressPartKeys
    .map((key) => [labels[key], text(form?.[`${prefix}${key[0].toUpperCase()}${key.slice(1)}`]).trim()])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join(', ')

  return formatted || text(fallback)
}

const optionValue = (value, otherValue) => {
  const selected = text(value).trim()
  if (selected !== 'Other' && selected !== 'Any Other') return selected
  return text(otherValue).trim() || selected
}

const splitList = (value) =>
  text(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const normalizedAllowed = (allowed) => allowed.map((item) => String(item))

export const normalizeSelections = (values, allowed) => {
  const selected = new Set((Array.isArray(values) ? values : []).map((item) => String(item)))
  const allowedStrings = normalizedAllowed(allowed)

  return allowed
    .filter((item, index) => selected.has(String(item)) && allowedStrings.indexOf(String(item)) === index)
    .map((item) => (typeof item === 'number' ? Number(item) : String(item)))
}

export const toggleSelection = (values, value, allowed) => {
  const normalized = normalizeSelections(values, allowed)
  const target = String(value)
  const hasValue = normalized.some((item) => String(item) === target)
  const next = hasValue ? normalized.filter((item) => String(item) !== target) : [...normalized, value]

  return normalizeSelections(next, allowed)
}

export const normalizeSingleSelection = (values, allowed) => normalizeSelections(values, allowed).slice(0, 1)

export const emptyRatings = (fields) =>
  fields.reduce((acc, field) => {
    acc[field.key] = []
    return acc
  }, {})

const normalizeRatings = (ratings, fields, allowed = RATING_VALUES) =>
  fields.reduce((acc, field) => {
    acc[field.key] = normalizeSingleSelection(ratings?.[field.key], allowed)
    return acc
  }, {})

const normalizeSuccessInfo = (successInfo = {}) =>
  SUCCESS_INFO_FIELDS.reduce((acc, field) => {
    acc[field.key] = text(successInfo?.[field.key])
    return acc
  }, {})

const emptyDirectorAssessment = () => ({
  classOfCandidate: [],
  priorityOfCandidate: [],
  counselingOfCandidate: [],
  counselingMode: []
})

const normalizeAssessment = (assessment = {}) => {
  const counselingOfCandidate = normalizeSingleSelection(assessment?.counselingOfCandidate, DIRECTOR_YES_NO_VALUES)

  return {
    classOfCandidate: normalizeSingleSelection(assessment?.classOfCandidate, DIRECTOR_RATING_VALUES),
    priorityOfCandidate: normalizeSingleSelection(assessment?.priorityOfCandidate, DIRECTOR_RATING_VALUES),
    counselingOfCandidate,
    counselingMode: counselingOfCandidate[0] === 'Yes' ? normalizeSingleSelection(assessment?.counselingMode, DIRECTOR_MODE_VALUES) : []
  }
}

const normalizeDirectorAssessment = normalizeAssessment

const emptyManagerAssessment = () => ({
  classOfCandidate: [],
  priorityOfCandidate: [],
  counselingOfCandidate: [],
  counselingMode: []
})

const normalizeManagerAssessment = normalizeAssessment

export const normalizeQuestionMarks = (value) => {
  const raw = text(value).trim()
  if (!raw) return ''

  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return ''

  const clamped = Math.max(0, Math.min(QUESTION_MARK_MAX, numeric))
  return Number.isInteger(clamped) ? String(clamped) : String(clamped)
}

export const emptyQuestionRow = () => ({ question: '', choices: [], marks: '' })

const normalizeQuestionRow = (row = {}) => ({
  question: text(row.question),
  choices: normalizeSingleSelection(row.choices, QUESTION_CHOICES),
  marks: normalizeQuestionMarks(row.marks ?? row.grade)
})

const questionHasContent = (row) => Boolean(text(row.question).trim() || row.choices?.length || normalizeQuestionMarks(row.marks))

export const buildQuestionRows = (rows) => {
  const source = Array.isArray(rows) ? rows.map(normalizeQuestionRow) : []
  const lastContentIndex = source.reduce((lastIndex, row, index) => (questionHasContent(row) ? index : lastIndex), -1)
  const targetLength = Math.max(INTERVIEW_QUESTION_COUNT, lastContentIndex + 1)

  return Array.from({ length: targetLength }, (_, index) => source[index] || emptyQuestionRow())
}

export const questionMarksScore = (row) => {
  const marks = normalizeQuestionMarks(row?.marks ?? row?.grade)
  if (!marks) return null

  const numeric = Number(marks)

  return Number.isFinite(numeric) ? numeric : null
}

export const calculateQuestionMarksResult = (questions, options = {}) => {
  const rows = options.preserveRows && Array.isArray(questions) && questions.length ? questions.map(normalizeQuestionRow) : buildQuestionRows(questions)
  const scores = rows.map(questionMarksScore)
  const activeQuestionCount = rows.filter(questionHasContent).length
  const total = scores.reduce((sum, score) => sum + (Number.isFinite(score) ? score : 0), 0)
  const maxTotal = activeQuestionCount * QUESTION_MARK_MAX
  const percentage = maxTotal ? (total / maxTotal) * 100 : 0
  const percentageLabel = Number.isInteger(percentage) ? `${percentage}%` : `${percentage.toFixed(2)}%`

  return {
    rows,
    scores,
    activeQuestionCount,
    total,
    maxTotal,
    percentage,
    percentageLabel
  }
}

export const emptyInterviewRow = () => ({
  id: Date.now() + Math.random(),
  candidateName: '',
  companyName: '',
  jobRole: '',
  referencePerson: '',
  attendInterview: '',
  interestedForJoin: '',
  remark: '',
  date: '',
  selectionChances: '',
  ratingForCompany: '',
  notAttendRemark: '',
  notInterestedReason: '',
  replyFromCompany: '',
  positiveFeedback: '',
  negativeFeedback: '',
  overallDiscussion: '',
  note: '',
  updatedBy: 'SJP HR',
  documents: [],
  status: 'Pending',
  baId: '',
  commissionPercent: ''
})

export const emptyCandidateForm = () => ({
  id: null,
  candidateCode: '',
  createdAt: '',
  formMeta: {
    day: '',
    receiptNo: '',
    rcWrc: '',
    date: ''
  },
  fullName: '',
  referenceName: '',
  advisorCode: '',
  mobile: '',
  gender: '',
  currentAge: '',
  marriageStatus: '',
  dateOfBirth: '',
  aadhaarNo: '',
  panNo: '',
  currentAddress: '',
  currentAddressVillage: '',
  currentAddressTaluka: '',
  currentAddressDistrict: '',
  currentAddressState: '',
  permanentAddress: '',
  permanentAddressVillage: '',
  permanentAddressTaluka: '',
  permanentAddressDistrict: '',
  permanentAddressState: '',
  sameAsCurrentAddress: false,
  collegeName: '',
  whatsappNo: '',
  email: '',
  educationSector: '',
  educationSectorOther: '',
  education: '',
  yearOfHigherEducation: '',
  educationBranch: '',
  educationBranchOther: '',
  educationSpecialization: '',
  educationSpecializationOther: '',
  computerCourse: '',
  computerCourseOther: '',
  certificationCourse: '',
  certificationCourseOther: '',
  computerCourses: '',
  instituteDesignation: '',
  instituteAddressVillage: '',
  instituteAddressTaluka: '',
  instituteAddressDistrict: '',
  instituteAddressState: '',
  college12GraduateName: '',
  postGraduateCollegeName: '',
  collegeTeacherName: '',
  collegeDesignation: '',
  collegeMobileNumber: '',
  collegeReference: '',
  collegeAddressVillage: '',
  collegeAddressTaluka: '',
  collegeAddressDistrict: '',
  collegeAddressState: '',
  otherAchievements: '',
  appliedFor: '',
  interestedDepartment: '',
  interestedDepartmentOther: '',
  lookingForField: '',
  preferredIndustry: '',
  preferredIndustryOther: '',
  industrySpecialization: '',
  industrySpecializationOther: '',
  preferredJobLocation: '',
  availabilityForInterview: '',
  totalExperience: '',
  experienceType: '',
  experienceDepartment: '',
  currentCompany: '',
  keyResponsibilities: '',
  keySkillsKnowledge: '',
  careerJobResponsibilities: '',
  netInHandSalary: '',
  grossSalaryPerMonth: '',
  ctcSalaryPerMonth: '',
  expectedNetInHandSalary: '',
  expectedGrossSalaryPerMonth: '',
  expectedCtcSalaryPerMonth: '',
  currentSalary: '',
  expectedSalary: '',
  jobWorkingStatus: '',
  noticePeriod: '',
  noticePeriodOther: '',
  careerSummary: '',
  currentJobLocation: '',
  reasonForJobChange: '',
  reasonForJobChangeOther: '',
  referenceProfile: '',
  referenceProfileOther: '',
  referenceSources: [],
  placementReference: {
    professorName: '',
    professorContactNumber: '',
    referenceBy: '',
    referenceContactNumber: ''
  },
  familyDetails: {
    fatherOrHusbandName: '',
    fatherOccupation: '',
    fatherMobileNumber: '',
    motherOrWifeName: '',
    motherOccupation: '',
    motherMobileNumber: '',
    siblingName: '',
    siblingEducationOccupation: '',
    brotherOccupation: '',
    sisterOccupation: ''
  },
  goalAim: '',
  feedback: '',
  suggestion: '',
  documents: [],
  successInfo: normalizeSuccessInfo(),
  interviewForm: {
    suitableIndustry: '',
    suitableDepartment: '',
    hrInterviewer: '',
    remark: '',
    professionalRatings: emptyRatings(PROFESSIONAL_RATING_FIELDS),
    personalityRatings: emptyRatings(PERSONALITY_RATING_FIELDS),
    directorAssessment: emptyDirectorAssessment(),
    managerAssessment: emptyManagerAssessment(),
    iqSelections: [],
    tqSelections: [],
    grade: '',
    questions: buildQuestionRows()
  },
  interviews: []
})

export const mapInterviewToForm = (row, fallbackReference = '') => ({
  id: row?._id || Date.now() + Math.random(),
  candidateName: text(row?.candidateName),
  companyName: text(row?.companyName),
  jobRole: text(row?.jobRole),
  referencePerson: text(row?.reference || fallbackReference || 'Walk-in'),
  attendInterview: text(row?.attendInterview),
  interestedForJoin: text(row?.interestedForJoin),
  remark: text(row?.remark),
  date: dateInput(row?.interviewDate),
  selectionChances: text(row?.selectionChances),
  ratingForCompany: row?.ratingForCompany ?? '',
  notAttendRemark: text(row?.notAttendRemark),
  notInterestedReason: text(row?.notInterestedReason),
  replyFromCompany: text(row?.replyFromCompany),
  positiveFeedback: text(row?.positiveFeedback),
  negativeFeedback: text(row?.negativeFeedback),
  overallDiscussion: text(row?.overallDiscussion || row?.remark),
  note: text(row?.note),
  updatedBy: text(row?.updatedBy || 'SJP HR'),
  documents: Array.isArray(row?.documents) ? row.documents : [],
  status: row?.result || 'Pending',
  baId: '',
  commissionPercent: ''
})

export const mapApiToCandidateForm = (payload) => {
  const base = emptyCandidateForm()
  const candidate = payload?.candidate || payload || {}
  const applicationDetails = candidate?.applicationDetails || {}
  const personal = applicationDetails.personal || {}
  const educationDetails = applicationDetails.education || {}
  const professional = applicationDetails.professional || {}
  const referenceSuccess = applicationDetails.referenceSuccess || {}
  const currentAddressParts = parseAddressParts(personal.currentAddress || candidate?.currentAddress)
  const permanentAddressParts = parseAddressParts(personal.permanentAddress || candidate?.permanentAddress)
  const instituteAddressParts = parseAddressParts(educationDetails.instituteReference?.address)
  const collegeAddressParts = parseAddressParts(educationDetails.instituteCollege?.address)
  const interviewForm = candidate?.interviewForm || {}

  return {
    ...base,
    id: candidate?._id || null,
    candidateCode: text(candidate?.candidateCode),
    createdAt: text(candidate?.createdAt),
    formMeta: {
      day: text(candidate?.formMeta?.day),
      receiptNo: text(candidate?.formMeta?.receiptNo),
      rcWrc: text(candidate?.formMeta?.rcWrc),
      date: dateInput(candidate?.formMeta?.date)
    },
    fullName: text(personal.candidateName || candidate?.fullName),
    referenceName: text(candidate?.referenceName),
    advisorCode: text(referenceSuccess.advisorCode || candidate?.advisorCode || candidate?.advisor?.advisorCode),
    mobile: text(personal.mobileNumber || candidate?.mobileNumber),
    gender: text(personal.gender || candidate?.gender),
    currentAge: personal.currentAge ?? candidate?.currentAge ?? '',
    marriageStatus: text(personal.marriageStatus || candidate?.marriageStatus),
    dateOfBirth: dateInput(personal.dateOfBirth || candidate?.dateOfBirth),
    aadhaarNo: text(personal.aadhaarNo || candidate?.aadhaarNo),
    panNo: text(personal.panNo || candidate?.panNo),
    currentAddress: text(candidate?.currentAddress),
    currentAddressVillage: currentAddressParts.village,
    currentAddressTaluka: currentAddressParts.taluka,
    currentAddressDistrict: currentAddressParts.district,
    currentAddressState: currentAddressParts.state,
    permanentAddress: text(candidate?.permanentAddress),
    permanentAddressVillage: permanentAddressParts.village,
    permanentAddressTaluka: permanentAddressParts.taluka,
    permanentAddressDistrict: permanentAddressParts.district,
    permanentAddressState: permanentAddressParts.state,
    sameAsCurrentAddress: Boolean(personal.sameAsCurrentAddress),
    collegeName: text(educationDetails.instituteReference?.instituteName || candidate?.collegeName),
    whatsappNo: text(personal.whatsappNo || candidate?.whatsappNo),
    email: text(personal.emailId || candidate?.emailId),
    educationSector: text(educationDetails.educationSector || educationDetails.highestEducation),
    educationSectorOther: text(educationDetails.educationSectorOther),
    education: text(candidate?.education),
    yearOfHigherEducation: text(educationDetails.yearOfHigherEducation || candidate?.yearOfHigherEducation),
    educationBranch: text(educationDetails.educationBranch || educationDetails.branch),
    educationBranchOther: text(educationDetails.educationBranchOther),
    educationSpecialization: text(educationDetails.educationSpecialization || educationDetails.specialization || candidate?.specialization),
    educationSpecializationOther: text(educationDetails.educationSpecializationOther),
    computerCourse: text(educationDetails.computerCourse),
    computerCourseOther: text(educationDetails.computerCourseOther),
    certificationCourse: text(educationDetails.certificationCourse),
    certificationCourseOther: text(educationDetails.certificationCourseOther),
    computerCourses: text(candidate?.computerCourses),
    instituteDesignation: text(educationDetails.instituteReference?.designation),
    instituteAddressVillage: instituteAddressParts.village,
    instituteAddressTaluka: instituteAddressParts.taluka,
    instituteAddressDistrict: instituteAddressParts.district,
    instituteAddressState: instituteAddressParts.state,
    college12GraduateName: text(educationDetails.instituteCollege?.college12GraduateName),
    postGraduateCollegeName: text(educationDetails.instituteCollege?.postGraduateCollegeName),
    collegeTeacherName: text(educationDetails.instituteCollege?.teacherName),
    collegeDesignation: text(educationDetails.instituteCollege?.designation),
    collegeMobileNumber: text(educationDetails.instituteCollege?.mobileNumber),
    collegeReference: text(educationDetails.instituteCollege?.reference),
    collegeAddressVillage: collegeAddressParts.village,
    collegeAddressTaluka: collegeAddressParts.taluka,
    collegeAddressDistrict: collegeAddressParts.district,
    collegeAddressState: collegeAddressParts.state,
    otherAchievements: text(candidate?.otherAchievements),
    appliedFor: text(candidate?.appliedFor || candidate?.currentDesignation),
    interestedDepartment: text(professional.preferredDepartmentRaw || professional.preferredDepartment || candidate?.interestedDepartment || candidate?.specialization),
    interestedDepartmentOther: text(professional.preferredDepartmentOther),
    lookingForField: text(candidate?.lookingForField),
    preferredIndustry: text(professional.preferredIndustryRaw || professional.preferredIndustry || candidate?.preferredIndustry),
    preferredIndustryOther: text(professional.preferredIndustryOther),
    industrySpecialization: text(professional.industrySpecializationRaw || professional.industrySpecialization),
    industrySpecializationOther: text(professional.industrySpecializationOther),
    preferredJobLocation: text(professional.preferredJobLocation || candidate?.preferredJobLocation || candidate?.preferredLocation),
    availabilityForInterview: text(candidate?.availabilityForInterview),
    totalExperience: professional.totalExperience ?? candidate?.totalExperience ?? '',
    experienceType: text(professional.experienceType) || (candidate?.totalExperience ? 'Experience' : ''),
    experienceDepartment: text(candidate?.experienceDepartment),
    currentCompany: text(candidate?.currentCompany),
    keyResponsibilities: text(candidate?.keyResponsibilities),
    keySkillsKnowledge: text(professional.keySkillsKnowledge || (Array.isArray(candidate?.keySkills) ? candidate.keySkills.join(', ') : '')),
    careerJobResponsibilities: text(professional.careerJobResponsibilities || candidate?.keyResponsibilities),
    netInHandSalary: text(professional.currentSalary?.netInHand || candidate?.currentSalary),
    grossSalaryPerMonth: text(professional.currentSalary?.grossPerMonth),
    ctcSalaryPerMonth: text(professional.currentSalary?.ctcPerMonth),
    expectedNetInHandSalary: text(professional.expectedSalary?.netInHand || candidate?.expectedSalary),
    expectedGrossSalaryPerMonth: text(professional.expectedSalary?.grossPerMonth),
    expectedCtcSalaryPerMonth: text(professional.expectedSalary?.ctcPerMonth),
    currentSalary: text(candidate?.currentSalary),
    expectedSalary: text(candidate?.expectedSalary),
    jobWorkingStatus: text(professional.jobWorkingStatus),
    noticePeriod: text(professional.noticePeriodRaw || professional.noticePeriod || candidate?.noticePeriod),
    noticePeriodOther: text(professional.noticePeriodOther),
    careerSummary: text(candidate?.careerSummary),
    currentJobLocation: text(professional.currentJobLocation || candidate?.currentJobLocation),
    reasonForJobChange: text(professional.reasonForJobChangeRaw || professional.reasonForJobChange || candidate?.reasonForJobChange),
    reasonForJobChangeOther: text(professional.reasonForJobChangeOther),
    referenceProfile: text(referenceSuccess.referenceProfileRaw || referenceSuccess.referenceProfile),
    referenceProfileOther: text(referenceSuccess.referenceProfileOther),
    referenceSources: Array.isArray(referenceSuccess.referenceSources) ? referenceSuccess.referenceSources : [],
    placementReference: {
      professorName: text(educationDetails.instituteReference?.representativeName || candidate?.placementReference?.professorName),
      professorContactNumber: text(educationDetails.instituteReference?.mobileNumber || candidate?.placementReference?.professorContactNumber),
      referenceBy: text(referenceSuccess.referenceName || candidate?.placementReference?.referenceBy || candidate?.referenceName),
      referenceContactNumber: text(referenceSuccess.referenceMobileNumber || candidate?.placementReference?.referenceContactNumber)
    },
    familyDetails: {
      fatherOrHusbandName: text(personal.familyDetails?.fatherOrHusbandName || candidate?.familyDetails?.fatherOrHusbandName),
      fatherOccupation: text(personal.familyDetails?.fatherOccupation || candidate?.familyDetails?.fatherOccupation),
      fatherMobileNumber: text(personal.familyDetails?.fatherMobileNumber || candidate?.familyDetails?.fatherMobileNumber),
      motherOrWifeName: text(personal.familyDetails?.motherOrWifeName || candidate?.familyDetails?.motherOrWifeName),
      motherOccupation: text(personal.familyDetails?.motherOccupation || candidate?.familyDetails?.motherOccupation),
      motherMobileNumber: text(personal.familyDetails?.motherMobileNumber || candidate?.familyDetails?.motherMobileNumber),
      siblingName: text(personal.familyDetails?.siblingName || candidate?.familyDetails?.siblingName),
      siblingEducationOccupation: text(personal.familyDetails?.siblingEducationOccupation || candidate?.familyDetails?.siblingEducationOccupation),
      brotherOccupation: text(candidate?.familyDetails?.brotherOccupation),
      sisterOccupation: text(candidate?.familyDetails?.sisterOccupation)
    },
    goalAim: text(candidate?.goalAim),
    feedback: text(candidate?.feedback),
    suggestion: text(candidate?.suggestion),
    documents: Array.isArray(candidate?.documents) ? candidate.documents : [],
    successInfo: normalizeSuccessInfo(candidate?.successInfo),
    interviewForm: {
      suitableIndustry: text(interviewForm?.suitableIndustry),
      suitableDepartment: text(interviewForm?.suitableDepartment),
      hrInterviewer: text(interviewForm?.hrInterviewer),
      remark: text(interviewForm?.remark),
      professionalRatings: normalizeRatings(interviewForm?.professionalRatings, PROFESSIONAL_RATING_FIELDS),
      personalityRatings: normalizeRatings(interviewForm?.personalityRatings, PERSONALITY_RATING_FIELDS),
      directorAssessment: normalizeDirectorAssessment(interviewForm?.directorAssessment),
      managerAssessment: normalizeManagerAssessment(interviewForm?.managerAssessment),
      iqSelections: normalizeSelections(interviewForm?.iqSelections, IQ_TQ_VALUES),
      tqSelections: normalizeSelections(interviewForm?.tqSelections, IQ_TQ_VALUES),
      grade: text(interviewForm?.grade),
      questions: buildQuestionRows(interviewForm?.questions)
    },
    interviews:
      Array.isArray(payload?.interviews) && payload.interviews.length
        ? payload.interviews.map((row) => mapInterviewToForm(row, candidate?.referenceName))
        : []
  }
}

const numberOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const numberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const currentAddressObject = (form) => ({
  village: text(form?.currentAddressVillage),
  taluka: text(form?.currentAddressTaluka),
  district: text(form?.currentAddressDistrict),
  state: text(form?.currentAddressState)
})

const permanentAddressObject = (form) => ({
  village: text(form?.permanentAddressVillage),
  taluka: text(form?.permanentAddressTaluka),
  district: text(form?.permanentAddressDistrict),
  state: text(form?.permanentAddressState)
})

const instituteAddressObject = (form) => ({
  village: text(form?.instituteAddressVillage),
  taluka: text(form?.instituteAddressTaluka),
  district: text(form?.instituteAddressDistrict),
  state: text(form?.instituteAddressState)
})

const collegeAddressObject = (form) => ({
  village: text(form?.collegeAddressVillage),
  taluka: text(form?.collegeAddressTaluka),
  district: text(form?.collegeAddressDistrict),
  state: text(form?.collegeAddressState)
})

const formatCurrentSalaryDetails = (form) =>
  [
    text(form?.netInHandSalary) ? `NET / In-hand Salary: ${text(form.netInHandSalary)}` : '',
    text(form?.grossSalaryPerMonth) ? `Gross Per Month: ${text(form.grossSalaryPerMonth)}` : '',
    text(form?.ctcSalaryPerMonth) ? `CTC Per Month: ${text(form.ctcSalaryPerMonth)}` : ''
  ].filter(Boolean).join('\n')

const formatExpectedSalaryDetails = (form) =>
  [
    text(form?.expectedNetInHandSalary) ? `Expected NET / In-hand Salary: ${text(form.expectedNetInHandSalary)}` : '',
    text(form?.expectedGrossSalaryPerMonth) ? `Expected Gross Per Month: ${text(form.expectedGrossSalaryPerMonth)}` : '',
    text(form?.expectedCtcSalaryPerMonth) ? `Expected CTC Per Month: ${text(form.expectedCtcSalaryPerMonth)}` : ''
  ].filter(Boolean).join('\n')

const formatComputerCourses = (form) => {
  const computerCourse = optionValue(form?.computerCourse, form?.computerCourseOther)
  const certificationCourse = optionValue(form?.certificationCourse, form?.certificationCourseOther)

  return [
    computerCourse ? `Computer Course: ${computerCourse}` : '',
    certificationCourse ? `Other Certification Course: ${certificationCourse}` : ''
  ].filter(Boolean).join('\n')
}

const formatEducationDetails = (form) => {
  const highestEducation = optionValue(form?.educationSector, form?.educationSectorOther)
  const branch = optionValue(form?.educationBranch, form?.educationBranchOther)
  const specialization = optionValue(form?.educationSpecialization, form?.educationSpecializationOther)

  return [
    highestEducation ? `Highest Education: ${highestEducation}` : '',
    text(form?.yearOfHigherEducation) ? `Year of Higher Education: ${text(form.yearOfHigherEducation)}` : '',
    branch ? `Education Branch: ${branch}` : '',
    specialization ? `Education Specialization: ${specialization}` : ''
  ].filter(Boolean).join('\n')
}

const formatInstituteReferenceDetails = (form) => {
  const address = formatAddressParts(form, 'instituteAddress')
  return [
    text(form?.collegeName) ? `Institute Name: ${text(form.collegeName)}` : '',
    text(form?.placementReference?.professorName) ? `Institute Representative Name: ${text(form.placementReference.professorName)}` : '',
    text(form?.instituteDesignation) ? `Designation: ${text(form.instituteDesignation)}` : '',
    text(form?.placementReference?.professorContactNumber) ? `Institute Mobile Number: ${text(form.placementReference.professorContactNumber)}` : '',
    address ? `Institute Address: ${address}` : ''
  ].filter(Boolean).join('\n')
}

const formatInstituteCollegeDetails = (form) => {
  const address = formatAddressParts(form, 'collegeAddress')
  return [
    text(form?.college12GraduateName) ? `12th / Graduate College Name: ${text(form.college12GraduateName)}` : '',
    text(form?.postGraduateCollegeName) ? `Post Graduate College Name: ${text(form.postGraduateCollegeName)}` : '',
    text(form?.collegeTeacherName) ? `Teacher: ${text(form.collegeTeacherName)}` : '',
    text(form?.collegeDesignation) ? `Designation: ${text(form.collegeDesignation)}` : '',
    text(form?.collegeMobileNumber) ? `College Mobile Number: ${text(form.collegeMobileNumber)}` : '',
    text(form?.collegeReference) ? `Reference: ${text(form.collegeReference)}` : '',
    address ? `College Address: ${address}` : ''
  ].filter(Boolean).join('\n')
}

const applicationDetailsFromForm = (form) => {
  const highestEducation = optionValue(form?.educationSector, form?.educationSectorOther)
  const branch = optionValue(form?.educationBranch, form?.educationBranchOther)
  const educationSpecialization = optionValue(form?.educationSpecialization, form?.educationSpecializationOther)
  const preferredDepartment = optionValue(form?.interestedDepartment, form?.interestedDepartmentOther)
  const preferredIndustry = optionValue(form?.preferredIndustry, form?.preferredIndustryOther)
  const industrySpecialization = optionValue(form?.industrySpecialization, form?.industrySpecializationOther)
  const noticePeriod = optionValue(form?.noticePeriod, form?.noticePeriodOther)
  const reasonForJobChange = optionValue(form?.reasonForJobChange, form?.reasonForJobChangeOther)
  const referenceProfile = optionValue(form?.referenceProfile, form?.referenceProfileOther)

  return {
    personal: {
      candidateName: text(form?.fullName),
      mobileNumber: text(form?.mobile).replace(/\D/g, ''),
      whatsappNo: text(form?.whatsappNo).replace(/\D/g, ''),
      emailId: text(form?.email),
      gender: text(form?.gender),
      currentAge: text(form?.currentAge),
      marriageStatus: text(form?.marriageStatus),
      aadhaarNo: text(form?.aadhaarNo).replace(/\D/g, ''),
      panNo: text(form?.panNo).trim().toUpperCase(),
      dateOfBirth: form?.dateOfBirth || '',
      currentAddress: currentAddressObject(form),
      permanentAddress: form?.sameAsCurrentAddress ? currentAddressObject(form) : permanentAddressObject(form),
      sameAsCurrentAddress: Boolean(form?.sameAsCurrentAddress),
      familyDetails: {
        fatherOrHusbandName: text(form?.familyDetails?.fatherOrHusbandName),
        fatherOccupation: text(form?.familyDetails?.fatherOccupation),
        fatherMobileNumber: text(form?.familyDetails?.fatherMobileNumber).replace(/\D/g, ''),
        motherOrWifeName: text(form?.familyDetails?.motherOrWifeName),
        motherOccupation: text(form?.familyDetails?.motherOccupation),
        motherMobileNumber: text(form?.familyDetails?.motherMobileNumber).replace(/\D/g, ''),
        siblingName: text(form?.familyDetails?.siblingName),
        siblingEducationOccupation: text(form?.familyDetails?.siblingEducationOccupation)
      }
    },
    education: {
      educationSector: text(form?.educationSector),
      educationSectorOther: text(form?.educationSectorOther),
      highestEducation,
      yearOfHigherEducation: text(form?.yearOfHigherEducation),
      educationBranch: text(form?.educationBranch),
      educationBranchOther: text(form?.educationBranchOther),
      branch,
      educationSpecialization: text(form?.educationSpecialization),
      educationSpecializationOther: text(form?.educationSpecializationOther),
      specialization: educationSpecialization,
      computerCourse: text(form?.computerCourse),
      computerCourseOther: text(form?.computerCourseOther),
      certificationCourse: text(form?.certificationCourse),
      certificationCourseOther: text(form?.certificationCourseOther),
      instituteReference: {
        instituteName: text(form?.collegeName),
        representativeName: text(form?.placementReference?.professorName),
        designation: text(form?.instituteDesignation),
        mobileNumber: text(form?.placementReference?.professorContactNumber).replace(/\D/g, ''),
        address: instituteAddressObject(form)
      },
      instituteCollege: {
        college12GraduateName: text(form?.college12GraduateName),
        postGraduateCollegeName: text(form?.postGraduateCollegeName),
        teacherName: text(form?.collegeTeacherName),
        designation: text(form?.collegeDesignation),
        mobileNumber: text(form?.collegeMobileNumber).replace(/\D/g, ''),
        reference: text(form?.collegeReference),
        address: collegeAddressObject(form)
      }
    },
    professional: {
      preferredDepartment,
      preferredDepartmentRaw: text(form?.interestedDepartment),
      preferredDepartmentOther: text(form?.interestedDepartmentOther),
      preferredIndustry,
      preferredIndustryRaw: text(form?.preferredIndustry),
      preferredIndustryOther: text(form?.preferredIndustryOther),
      industrySpecialization,
      industrySpecializationRaw: text(form?.industrySpecialization),
      industrySpecializationOther: text(form?.industrySpecializationOther),
      currentSalary: {
        netInHand: text(form?.netInHandSalary),
        grossPerMonth: text(form?.grossSalaryPerMonth),
        ctcPerMonth: text(form?.ctcSalaryPerMonth)
      },
      expectedSalary: {
        netInHand: text(form?.expectedNetInHandSalary),
        grossPerMonth: text(form?.expectedGrossSalaryPerMonth),
        ctcPerMonth: text(form?.expectedCtcSalaryPerMonth)
      },
      currentJobLocation: text(form?.currentJobLocation),
      preferredJobLocation: text(form?.preferredJobLocation),
      jobWorkingStatus: text(form?.jobWorkingStatus),
      experienceType: text(form?.experienceType),
      totalExperience: text(form?.experienceType) === 'Fresher' ? '0' : text(form?.totalExperience),
      noticePeriod,
      noticePeriodRaw: text(form?.noticePeriod),
      noticePeriodOther: text(form?.noticePeriodOther),
      reasonForJobChange,
      reasonForJobChangeRaw: text(form?.reasonForJobChange),
      reasonForJobChangeOther: text(form?.reasonForJobChangeOther),
      keySkillsKnowledge: text(form?.keySkillsKnowledge),
      careerJobResponsibilities: text(form?.careerJobResponsibilities)
    },
    referenceSuccess: {
      advisorCode: text(form?.advisorCode).trim().toLowerCase(),
      referenceName: text(form?.placementReference?.referenceBy),
      referenceMobileNumber: text(form?.placementReference?.referenceContactNumber).replace(/\D/g, ''),
      referenceProfile,
      referenceProfileRaw: text(form?.referenceProfile),
      referenceProfileOther: text(form?.referenceProfileOther),
      referenceSources: Array.isArray(form?.referenceSources) ? form.referenceSources : []
    }
  }
}

export const mapCandidateFormToApi = (form) => ({
  formMeta: {
    day: text(form?.formMeta?.day),
    receiptNo: text(form?.formMeta?.receiptNo),
    rcWrc: text(form?.formMeta?.rcWrc),
    date: form?.formMeta?.date || null
  },
  fullName: text(form?.fullName).trim(),
  mobileNumber: text(form?.mobile).trim(),
  advisorCode: text(form?.advisorCode).trim(),
  collegeName: text(form?.collegeName),
  gender: form?.gender || null,
  currentAge: numberOrNull(form?.currentAge),
  marriageStatus: form?.marriageStatus || null,
  dateOfBirth: form?.dateOfBirth || null,
  aadhaarNo: text(form?.aadhaarNo).replace(/\D/g, ''),
  panNo: text(form?.panNo).trim().toUpperCase(),
  currentAddress: formatAddressParts(form, 'currentAddress', form?.currentAddress),
  permanentAddress: form?.sameAsCurrentAddress
    ? formatAddressParts(form, 'currentAddress', form?.currentAddress)
    : formatAddressParts(form, 'permanentAddress', form?.permanentAddress),
  whatsappNo: text(form?.whatsappNo),
  emailId: text(form?.email),
  education: formatEducationDetails(form) || text(form?.education),
  yearOfHigherEducation: text(form?.yearOfHigherEducation),
  computerCourses: formatComputerCourses(form) || text(form?.computerCourses),
  otherAchievements: [formatInstituteReferenceDetails(form), formatInstituteCollegeDetails(form), text(form?.otherAchievements)].filter(Boolean).join('\n\n'),
  specialization: optionValue(form?.educationSpecialization, form?.educationSpecializationOther),
  appliedFor: optionValue(form?.interestedDepartment, form?.interestedDepartmentOther) || text(form?.appliedFor),
  interestedDepartment: optionValue(form?.interestedDepartment, form?.interestedDepartmentOther),
  lookingForField: text(form?.lookingForField),
  preferredIndustry: optionValue(form?.preferredIndustry, form?.preferredIndustryOther),
  preferredJobLocation: text(form?.preferredJobLocation),
  preferredLocation: text(form?.preferredJobLocation),
  availabilityForInterview: text(form?.availabilityForInterview),
  totalExperience: text(form?.experienceType) === 'Fresher' ? 0 : numberOrUndefined(form?.totalExperience),
  experienceDepartment: text(form?.experienceDepartment),
  currentCompany: text(form?.currentCompany),
  keyResponsibilities: text(form?.careerJobResponsibilities || form?.keyResponsibilities),
  keySkills: splitList(form?.keySkillsKnowledge),
  currentSalary: formatCurrentSalaryDetails(form) || text(form?.currentSalary),
  expectedSalary: formatExpectedSalaryDetails(form) || text(form?.expectedSalary),
  noticePeriod: optionValue(form?.noticePeriod, form?.noticePeriodOther) || text(form?.noticePeriod),
  careerSummary: [
    optionValue(form?.industrySpecialization, form?.industrySpecializationOther) ? `Industry Specialization: ${optionValue(form?.industrySpecialization, form?.industrySpecializationOther)}` : '',
    text(form?.jobWorkingStatus) ? `Job Working Status: ${text(form.jobWorkingStatus)}` : '',
    text(form?.experienceType) ? `Total Experience Type: ${text(form.experienceType)}` : '',
    optionValue(form?.noticePeriod, form?.noticePeriodOther) ? `Notice Period: ${optionValue(form?.noticePeriod, form?.noticePeriodOther)}` : '',
    text(form?.careerSummary)
  ].filter(Boolean).join('\n'),
  currentJobLocation: text(form?.currentJobLocation),
  reasonForJobChange: optionValue(form?.reasonForJobChange, form?.reasonForJobChangeOther) || text(form?.reasonForJobChange),
  placementReference: {
    professorName: text(form?.placementReference?.professorName),
    professorContactNumber: text(form?.placementReference?.professorContactNumber).replace(/\D/g, ''),
    referenceBy: text(form?.placementReference?.referenceBy),
    referenceContactNumber: text(form?.placementReference?.referenceContactNumber).replace(/\D/g, '')
  },
  familyDetails: {
    fatherOrHusbandName: text(form?.familyDetails?.fatherOrHusbandName),
    fatherOccupation: text(form?.familyDetails?.fatherOccupation),
    fatherMobileNumber: text(form?.familyDetails?.fatherMobileNumber).replace(/\D/g, ''),
    motherOrWifeName: text(form?.familyDetails?.motherOrWifeName),
    motherOccupation: text(form?.familyDetails?.motherOccupation),
    motherMobileNumber: text(form?.familyDetails?.motherMobileNumber).replace(/\D/g, ''),
    siblingName: text(form?.familyDetails?.siblingName),
    siblingEducationOccupation: text(form?.familyDetails?.siblingEducationOccupation),
    brotherOccupation: text(form?.familyDetails?.brotherOccupation),
    sisterOccupation: text(form?.familyDetails?.sisterOccupation)
  },
  goalAim: text(form?.goalAim),
  feedback: text(form?.feedback),
  suggestion: text(form?.suggestion),
  applicationDetails: applicationDetailsFromForm(form),
  successInfo: normalizeSuccessInfo(form?.successInfo),
  interviewForm: {
    suitableIndustry: text(form?.interviewForm?.suitableIndustry),
    suitableDepartment: text(form?.interviewForm?.suitableDepartment),
    hrInterviewer: text(form?.interviewForm?.hrInterviewer),
    remark: text(form?.interviewForm?.remark),
    professionalRatings: normalizeRatings(form?.interviewForm?.professionalRatings, PROFESSIONAL_RATING_FIELDS),
    personalityRatings: normalizeRatings(form?.interviewForm?.personalityRatings, PERSONALITY_RATING_FIELDS),
    directorAssessment: normalizeDirectorAssessment(form?.interviewForm?.directorAssessment),
    managerAssessment: normalizeManagerAssessment(form?.interviewForm?.managerAssessment),
    iqSelections: normalizeSelections(form?.interviewForm?.iqSelections, IQ_TQ_VALUES),
    tqSelections: normalizeSelections(form?.interviewForm?.tqSelections, IQ_TQ_VALUES),
    grade: text(form?.interviewForm?.grade),
    questions: buildQuestionRows(form?.interviewForm?.questions)
  }
})

export const isMongoId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''))

export const interviewHasContent = (row) =>
  Boolean(
    text(row?.companyName).trim() ||
      text(row?.jobRole).trim() ||
      text(row?.referencePerson).trim() ||
      text(row?.attendInterview).trim() ||
      text(row?.interestedForJoin).trim() ||
      text(row?.remark).trim() ||
      text(row?.date).trim() ||
      text(row?.selectionChances).trim() ||
      text(row?.ratingForCompany).trim() ||
      text(row?.notAttendRemark).trim() ||
      text(row?.notInterestedReason).trim() ||
      text(row?.replyFromCompany).trim() ||
      text(row?.positiveFeedback).trim() ||
      text(row?.negativeFeedback).trim() ||
      text(row?.overallDiscussion).trim() ||
      text(row?.note).trim() ||
      (row?.status && row.status !== 'Pending')
  )

export const sanitizeInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => interviewHasContent(row) && text(row?.companyName).trim())

export const mapFormInterviewToApi = (row) => ({
  candidateName: text(row?.candidateName),
  companyName: text(row?.companyName),
  jobRole: text(row?.jobRole),
  reference: text(row?.referencePerson),
  attendInterview: text(row?.attendInterview),
  interestedForJoin: text(row?.interestedForJoin),
  interviewDate: row?.date || null,
  selectionChances: text(row?.selectionChances),
  ratingForCompany: numberOrUndefined(row?.ratingForCompany),
  notAttendRemark: text(row?.notAttendRemark),
  notInterestedReason: text(row?.notInterestedReason),
  replyFromCompany: text(row?.replyFromCompany),
  positiveFeedback: text(row?.positiveFeedback),
  negativeFeedback: text(row?.negativeFeedback),
  overallDiscussion: text(row?.overallDiscussion),
  note: text(row?.note),
  updatedBy: text(row?.updatedBy || 'SJP HR'),
  remark: text(row?.remark),
  result: row?.status || 'Pending'
})

export const formatRatingSummary = (ratings, fields) =>
  fields
    .map((field) => {
      const selected = normalizeSingleSelection(ratings?.[field.key], RATING_VALUES)
      return selected.length ? `${field.label}: ${selected.join('/')}` : null
    })
    .filter(Boolean)
    .join(' ; ')

export const formatSelectionSummary = (values) => normalizeSelections(values, IQ_TQ_VALUES).join('/')

export const formatQuestionSummary = (questions) =>
  buildQuestionRows(questions)
    .map((row, index) => {
      const question = row.question.trim()
      const choices = row.choices.join('/')
      if (!question && !choices) return null
      return `Q${index + 1}${choices ? ` [${choices}]` : ''}${question ? `: ${question}` : ''}`
    })
    .filter(Boolean)
    .join(' ; ')
