export const RATING_VALUES = [1, 2, 3, 4, 5]
export const IQ_TQ_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
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

export const SUCCESS_INFO_FIELDS = [
  { key: 'numberSave', label: 'Number Save' },
  { key: 'groupJoin', label: 'Group Join' },
  { key: 'bwType', label: 'BW Type' },
  { key: 'byWhichStaff', label: 'By Which Staff' },
  { key: 'candidateClass', label: 'Class Of Candidate' },
  { key: 'alternateNumbers', label: 'Two Alternate Number' },
  { key: 'relation', label: 'Relation' },
  { key: 'reference', label: 'Reference' },
  { key: 'referenceMobileNo', label: 'Reference Mobile No' },
  { key: 'whatsappChannelCommunity', label: 'WhatsApp Channel / Community' },
  { key: 'candidateDataSource', label: 'Candidates Data (College/Institute/Company)' },
  { key: 'googleForm', label: 'Google Form' },
  { key: 'justDialGoogleFeedback', label: 'Just Dial / Google Feedback' },
  { key: 'hrContactDetails', label: 'HR Contact Details' },
  { key: 'rcWrcStatus', label: 'RC / WRC Status' },
  { key: 'interviewAttainedList', label: 'Interview Attained List (Company Name)' }
]

const text = (value) => String(value ?? '')

const dateInput = (value) => (value ? String(value).slice(0, 10) : '')

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
  const total = scores.reduce((sum, score) => sum + (Number.isFinite(score) ? score : 0), 0)

  return {
    rows,
    scores,
    total,
    maxTotal: scores.length * QUESTION_MARK_MAX
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
  aadhaarNo: '',
  panNo: '',
  currentAddress: '',
  permanentAddress: '',
  collegeName: '',
  whatsappNo: '',
  email: '',
  education: '',
  yearOfHigherEducation: '',
  computerCourses: '',
  otherAchievements: '',
  appliedFor: '',
  interestedDepartment: '',
  lookingForField: '',
  preferredIndustry: '',
  preferredJobLocation: '',
  availabilityForInterview: '',
  totalExperience: '',
  experienceDepartment: '',
  currentCompany: '',
  keyResponsibilities: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  careerSummary: '',
  currentJobLocation: '',
  reasonForJobChange: '',
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
    fullName: text(candidate?.fullName),
    referenceName: text(candidate?.referenceName),
    advisorCode: text(candidate?.advisorCode || candidate?.advisor?.advisorCode),
    mobile: text(candidate?.mobileNumber),
    gender: text(candidate?.gender),
    currentAge: candidate?.currentAge ?? '',
    marriageStatus: text(candidate?.marriageStatus),
    aadhaarNo: text(candidate?.aadhaarNo),
    panNo: text(candidate?.panNo),
    currentAddress: text(candidate?.currentAddress),
    permanentAddress: text(candidate?.permanentAddress),
    collegeName: text(candidate?.collegeName),
    whatsappNo: text(candidate?.whatsappNo),
    email: text(candidate?.emailId),
    education: text(candidate?.education),
    yearOfHigherEducation: text(candidate?.yearOfHigherEducation),
    computerCourses: text(candidate?.computerCourses),
    otherAchievements: text(candidate?.otherAchievements),
    appliedFor: text(candidate?.appliedFor || candidate?.currentDesignation),
    interestedDepartment: text(candidate?.interestedDepartment || candidate?.specialization),
    lookingForField: text(candidate?.lookingForField),
    preferredIndustry: text(candidate?.preferredIndustry),
    preferredJobLocation: text(candidate?.preferredJobLocation || candidate?.preferredLocation),
    availabilityForInterview: text(candidate?.availabilityForInterview),
    totalExperience: candidate?.totalExperience ?? '',
    experienceDepartment: text(candidate?.experienceDepartment),
    currentCompany: text(candidate?.currentCompany),
    keyResponsibilities: text(candidate?.keyResponsibilities),
    currentSalary: text(candidate?.currentSalary),
    expectedSalary: text(candidate?.expectedSalary),
    noticePeriod: text(candidate?.noticePeriod),
    careerSummary: text(candidate?.careerSummary),
    currentJobLocation: text(candidate?.currentJobLocation || candidate?.currentAddress),
    reasonForJobChange: text(candidate?.reasonForJobChange),
    placementReference: {
      professorName: text(candidate?.placementReference?.professorName),
      professorContactNumber: text(candidate?.placementReference?.professorContactNumber),
      referenceBy: text(candidate?.placementReference?.referenceBy || candidate?.referenceName),
      referenceContactNumber: text(candidate?.placementReference?.referenceContactNumber)
    },
    familyDetails: {
      fatherOrHusbandName: text(candidate?.familyDetails?.fatherOrHusbandName),
      fatherOccupation: text(candidate?.familyDetails?.fatherOccupation),
      fatherMobileNumber: text(candidate?.familyDetails?.fatherMobileNumber),
      motherOrWifeName: text(candidate?.familyDetails?.motherOrWifeName),
      motherOccupation: text(candidate?.familyDetails?.motherOccupation),
      motherMobileNumber: text(candidate?.familyDetails?.motherMobileNumber),
      siblingName: text(candidate?.familyDetails?.siblingName),
      siblingEducationOccupation: text(candidate?.familyDetails?.siblingEducationOccupation),
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
  aadhaarNo: text(form?.aadhaarNo).replace(/\D/g, ''),
  panNo: text(form?.panNo).trim().toUpperCase(),
  currentAddress: text(form?.currentAddress),
  permanentAddress: text(form?.permanentAddress),
  whatsappNo: text(form?.whatsappNo),
  emailId: text(form?.email),
  education: text(form?.education),
  yearOfHigherEducation: text(form?.yearOfHigherEducation),
  computerCourses: text(form?.computerCourses),
  otherAchievements: text(form?.otherAchievements),
  appliedFor: text(form?.appliedFor),
  interestedDepartment: text(form?.interestedDepartment),
  lookingForField: text(form?.lookingForField),
  preferredIndustry: text(form?.preferredIndustry),
  preferredJobLocation: text(form?.preferredJobLocation),
  preferredLocation: text(form?.preferredJobLocation),
  availabilityForInterview: text(form?.availabilityForInterview),
  totalExperience: numberOrUndefined(form?.totalExperience),
  experienceDepartment: text(form?.experienceDepartment),
  currentCompany: text(form?.currentCompany),
  keyResponsibilities: text(form?.keyResponsibilities),
  currentSalary: text(form?.currentSalary),
  expectedSalary: text(form?.expectedSalary),
  noticePeriod: text(form?.noticePeriod),
  careerSummary: text(form?.careerSummary),
  currentJobLocation: text(form?.currentJobLocation),
  reasonForJobChange: text(form?.reasonForJobChange),
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
  successInfo: normalizeSuccessInfo(form?.successInfo),
  interviewForm: {
    suitableIndustry: text(form?.interviewForm?.suitableIndustry),
    suitableDepartment: text(form?.interviewForm?.suitableDepartment),
    hrInterviewer: text(form?.interviewForm?.hrInterviewer),
    remark: text(form?.interviewForm?.remark),
    professionalRatings: normalizeRatings(form?.interviewForm?.professionalRatings, PROFESSIONAL_RATING_FIELDS),
    personalityRatings: normalizeRatings(form?.interviewForm?.personalityRatings, PERSONALITY_RATING_FIELDS),
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
