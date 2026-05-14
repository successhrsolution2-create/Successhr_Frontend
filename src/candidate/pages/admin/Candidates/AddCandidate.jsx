import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  Eye,
  ExternalLink,
  GraduationCap,
  Handshake,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  UserRound,
  Users,
  X
} from 'lucide-react'
import api from '../../../api/axios'
import { ConfirmDialog } from '../../../components/ActionDialogs'
import {
  allowedDocumentImageTypes,
  allCandidateDocumentTypes,
  candidateDocumentTypes,
  computerCourseDocumentKeys,
  educationCertificateDocumentKeys,
  educationCertificateLabel,
  MAX_DOCUMENT_IMAGE_SIZE,
  successDocumentTypes
} from '../../../constants/candidateDocuments'
import { copyToClipboard } from '../../../utils/copyToClipboard'
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
  emptyCandidateForm,
  emptyInterviewRow,
  emptyQuestionRow,
  buildQuestionRows,
  interviewHasContent,
  isMongoId,
  mapApiToCandidateForm,
  mapCandidateFormToApi,
  mapInterviewToForm,
  mapFormInterviewToApi,
  normalizeQuestionMarks,
  sanitizeInterviews
} from './candidateFormModel'

const inputClass =
  'mt-1 h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
const textAreaClass =
  'mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
const labelClass = 'block min-w-0 text-sm font-semibold text-slate-700'
const cardClass = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5'
const editablePanels = new Set(['details', 'documents', 'successInfo', 'assessment', 'interviews'])
const panelLabels = {
  details: 'Candidate Details',
  documents: 'Documents',
  successInfo: 'Success Info For Candidate',
  assessment: 'Success Interviewer Remark',
  interviews: 'Company Interviews'
}
const panelFromSearch = (searchParams) => {
  const panel = searchParams.get('panel')
  return editablePanels.has(panel) ? panel : 'details'
}

const documentTypeByLabel = allCandidateDocumentTypes.reduce((acc, item) => {
  acc[item.label.toLowerCase()] = item.key
  return acc
}, {})
const knownCandidateDocumentKeys = new Set(allCandidateDocumentTypes.map((item) => item.key))

const documentTypeAliases = {
  aadhaarcard: 'aadharCard',
  aadharcard: 'aadharCard',
  pancard: 'panCard',
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
  passportsizephoto: 'passportSizePhoto',
  medicalfitnesscertificate: 'medicalFitnessCertificate',
  medicalfitnesscertificates: 'medicalFitnessCertificate',
  computercoursecertificate: 'computerCourseCertificate',
  computercoursescertificate: 'computerCourseCertificate',
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

const normalizeDocToken = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const resolveDocumentType = (doc = {}) => {
  if (doc.documentType && knownCandidateDocumentKeys.has(String(doc.documentType))) return String(doc.documentType)

  const labelKey = String(doc.documentLabel || '').trim().toLowerCase()
  if (documentTypeByLabel[labelKey]) return documentTypeByLabel[labelKey]

  const normalizedLabel = normalizeDocToken(doc.documentLabel)
  if (documentTypeAliases[normalizedLabel]) return documentTypeAliases[normalizedLabel]

  const normalizedName = normalizeDocToken(doc.fileName)
  if (normalizedName.includes('resume')) return 'updatedResume'
  if (normalizedName.includes('aadhaar') || normalizedName.includes('aadhar')) return 'aadharCard'
  if (normalizedName.includes('pan')) return 'panCard'
  if (normalizedName.includes('passport') || normalizedName.includes('photo')) return 'passportSizePhoto'
  if (normalizedName.includes('salary')) return 'salarySlip'
  if (normalizedName.includes('bankstatement')) return 'bankStatement'
  if (normalizedName.includes('experience')) return 'experienceLetter'
  if (normalizedName.includes('candidatephoto') || normalizedName.includes('formalphoto')) return 'candidatePhoto'
  if (normalizedName.includes('10th') || normalizedName.includes('tenth') || normalizedName.includes('ssc') || normalizedName.includes('class10')) return 'tenthCertificate'
  if (normalizedName.includes('12th') || normalizedName.includes('twelfth') || normalizedName.includes('hsc') || normalizedName.includes('class12')) return 'twelfthCertificate'
  if (normalizedName.includes('postgraduate') || normalizedName.includes('postgraduation') || normalizedName.includes('pgcertificate')) return 'postGraduateCertificate'
  if (normalizedName.includes('graduate') || normalizedName.includes('graduation') || normalizedName.includes('degree')) return 'graduateCertificate'
  if (normalizedName.includes('mscit')) return 'msCitCertificate'
  if (normalizedName.includes('ccc')) return 'cccCertificate'
  if (normalizedName.includes('advancedexcel') || normalizedName.includes('excel')) return 'advancedExcelCertificate'
  if (normalizedName.includes('powerpoint') || normalizedName.includes('ppt')) return 'powerPointCertificate'
  if (normalizedName.includes('tally')) return 'tallyCertificate'
  if (normalizedName.includes('autocad') || normalizedName.includes('autocadd')) return 'autoCadCertificate'
  if (normalizedName.includes('typing')) return 'typingCertificate'
  if (normalizedName.includes('catia')) return 'catiaCertificate'
  if (normalizedName.includes('computercourse') || normalizedName.includes('computerclass')) return 'computerCourseCertificate'
  if (normalizedName.includes('jobjoining') && normalizedName.includes('hami')) return 'jobJoiningHamiPatra'
  if (normalizedName.includes('hamipatra') || normalizedName.includes('hp')) return 'hamiPatra'
  if (normalizedName.includes('concernletter') || normalizedName.includes('cl')) return 'concernLetter'
  if (normalizedName.includes('selectedvideo') || normalizedName.includes('feedbackvideo')) return 'selectedVideo'

  return ''
}

const latestDocumentsByType = (documents = []) => {
  const next = {}

  ;(Array.isArray(documents) ? documents : []).forEach((doc) => {
    const type = resolveDocumentType(doc)
    if (!type) return
    const current = next[type]
    const nextTime = new Date(doc?.uploadedAt || 0).getTime()
    const currentTime = new Date(current?.uploadedAt || 0).getTime()
    if (!current || nextTime >= currentTime) {
      next[type] = doc
    }
  })

  return next
}

const unmatchedDocuments = (documents = []) =>
  (Array.isArray(documents) ? documents : []).filter((doc) => !resolveDocumentType(doc))

const countDocumentsByType = (documents = []) => {
  const counts = {}
  ;(Array.isArray(documents) ? documents : []).forEach((doc) => {
    const type = resolveDocumentType(doc)
    if (!type) return
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

const documentsGroupedByType = (documents = []) => {
  const grouped = {}
  ;(Array.isArray(documents) ? documents : []).forEach((doc) => {
    const type = resolveDocumentType(doc)
    if (!type) return
    grouped[type] = grouped[type] || []
    grouped[type].push(doc)
  })
  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) => new Date(b?.uploadedAt || 0).getTime() - new Date(a?.uploadedAt || 0).getTime())
  })
  return grouped
}

const normalizeDocumentSearch = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const documentMatchesSearch = ({ item, label, docs = [], term, groupTitle = '' }) => {
  if (!term) return true
  const searchText = normalizeDocumentSearch(
    [
      groupTitle,
      label,
      item?.label,
      item?.description,
      item?.key,
      ...docs.flatMap((doc) => [doc?.documentLabel, doc?.fileName])
    ].filter(Boolean).join(' ')
  )
  return searchText.includes(term)
}

const extraDocumentMatchesSearch = (doc, term) => {
  if (!term) return true
  return normalizeDocumentSearch([doc?.documentLabel, doc?.fileName, doc?.documentType].filter(Boolean).join(' ')).includes(term)
}

const isImageDocLike = (doc = {}) =>
  String(doc?.mimeType || '').startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(String(doc?.fileName || ''))

const interviewDocumentTypes = [
  { key: 'appointmentLetter', label: 'Appointment Letter' },
  { key: 'offerLetter', label: 'Offer Letter' },
  { key: 'interviewLetter', label: 'Interview Letter' },
  { key: 'confirmationLetter', label: 'Confirmation Letter' }
]

const interviewDocumentLabelByKey = interviewDocumentTypes.reduce((acc, item) => {
  acc[item.key] = item.label
  return acc
}, {})

const allowedInterviewDocumentTypes = new Set(['image/jpeg', 'image/png', 'application/pdf'])

const groupInterviewDocumentsByType = (documents = []) => {
  const grouped = {}
  ;(Array.isArray(documents) ? documents : []).forEach((doc) => {
    const type = String(doc?.documentType || '')
    if (!interviewDocumentLabelByKey[type]) return
    grouped[type] = grouped[type] || []
    grouped[type].push(doc)
  })
  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) => new Date(b?.uploadedAt || 0).getTime() - new Date(a?.uploadedAt || 0).getTime())
  })
  return grouped
}

const safeFileName = (value) =>
  String(value || 'candidate')
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'candidate'

const isSelected = (values, value) => Array.isArray(values) && values.some((item) => String(item) === String(value))

const pdfPlainText = (value) =>
  String(value ?? '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '?')
    .replace(/\s+/g, ' ')
    .trim()

const escapePdfText = (value) => pdfPlainText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

const createSuccessRemarkPdf = (candidate) => {
  const pageWidth = 842
  const pageHeight = 595
  const margin = 28
  const pages = []
  let ops = []
  let y = margin

  const pdfY = (topY) => pageHeight - topY
  const color = ([r, g, b]) => `${r} ${g} ${b}`
  const add = (value) => ops.push(value)
  const finishPage = () => {
    if (ops.length) pages.push(ops.join('\n'))
    ops = []
    y = margin
  }
  const ensureSpace = (height) => {
    if (y + height > pageHeight - margin) finishPage()
  }
  const drawText = (text, x, topY, { size = 10, bold = false, fill = [0.06, 0.09, 0.16], maxWidth = 120 } = {}) => {
    const lineHeight = size * 1.25
    const words = pdfPlainText(text).split(' ').filter(Boolean)
    const lines = []
    let line = ''
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word
      if (next.length * size * 0.52 <= maxWidth) {
        line = next
      } else {
        if (line) lines.push(line)
        line = word
      }
    })
    if (line) lines.push(line)
    if (!lines.length) lines.push('')
    lines.forEach((item, index) => {
      add(`BT ${color(fill)} rg /F${bold ? 2 : 1} ${size} Tf ${x.toFixed(2)} ${pdfY(topY + size + index * lineHeight).toFixed(2)} Td (${escapePdfText(item)}) Tj ET`)
    })
    return lines.length * lineHeight
  }
  const drawRect = (x, topY, width, height, { stroke = [0.8, 0.84, 0.9], fill = null, lineWidth = 1 } = {}) => {
    add(`q ${lineWidth} w`)
    if (fill) add(`${color(fill)} rg`)
    if (stroke) add(`${color(stroke)} RG`)
    add(`${x.toFixed(2)} ${(pageHeight - topY - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`)
    add('Q')
  }
  const drawLine = (x1, y1, x2, y2, stroke = [0.1, 0.13, 0.2], lineWidth = 1) => {
    add(`q ${lineWidth} w ${color(stroke)} RG ${x1.toFixed(2)} ${pdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${pdfY(y2).toFixed(2)} l S Q`)
  }
  const drawCheckbox = (x, topY, checked) => {
    drawRect(x, topY, 10, 10, { stroke: [0.45, 0.45, 0.45] })
    if (checked) {
      drawLine(x + 2, topY + 5, x + 4.5, topY + 8, [0.02, 0.48, 0.84], 1.5)
      drawLine(x + 4.5, topY + 8, x + 8.5, topY + 2, [0.02, 0.48, 0.84], 1.5)
    }
  }
  const drawRatingPanel = (title, fields, ratings, x, topY, width) => {
    const headerHeight = 45
    const tableHeaderHeight = 26
    const rowHeight = 24
    const height = headerHeight + tableHeaderHeight + fields.length * rowHeight
    drawRect(x, topY, width, height, { stroke: [0.83, 0.88, 0.94] })
    drawRect(x, topY, width, headerHeight, { stroke: [0.83, 0.88, 0.94], fill: [0.97, 0.98, 0.99] })
    drawText(title, x + 12, topY + 10, { size: 11, bold: true, maxWidth: width - 24 })
    drawText('Rate following parameters: 1 lowest and 5 highest', x + 12, topY + 27, { size: 8.5, fill: [0.33, 0.42, 0.55], maxWidth: width - 24 })

    const srW = 36
    const scoreW = 36
    const paramW = width - srW - scoreW * RATING_VALUES.length
    let rowY = topY + headerHeight
    drawText('SR.', x + 12, rowY + 8, { size: 8.5, bold: true, fill: [0.39, 0.48, 0.61], maxWidth: srW })
    drawText('PARAMETERS', x + srW + 8, rowY + 8, { size: 8.5, bold: true, fill: [0.39, 0.48, 0.61], maxWidth: paramW })
    RATING_VALUES.forEach((value, index) => {
      drawText(value, x + srW + paramW + index * scoreW + 14, rowY + 8, { size: 8.5, bold: true, fill: [0.39, 0.48, 0.61], maxWidth: scoreW })
    })
    rowY += tableHeaderHeight
    fields.forEach((field, index) => {
      if (index % 2 === 1) drawRect(x, rowY, width, rowHeight, { stroke: null, fill: [0.97, 0.98, 0.99] })
      drawLine(x, rowY, x + width, rowY, [0.93, 0.95, 0.97], 0.6)
      drawText(index + 1, x + 12, rowY + 7, { size: 9, fill: [0.39, 0.48, 0.61], maxWidth: srW })
      drawText(field.label, x + srW + 8, rowY + 7, { size: 9.2, bold: true, maxWidth: paramW - 10 })
      RATING_VALUES.forEach((value, scoreIndex) => {
        drawCheckbox(x + srW + paramW + scoreIndex * scoreW + 13, rowY + 7, isSelected(ratings?.[field.key], value))
      })
      rowY += rowHeight
    })
    return height
  }
  const drawDirectorAssessment = () => {
    const fields = [
      ['Director - Class Of Candidate', candidate.interviewForm.directorAssessment?.classOfCandidate?.[0] || '-'],
      ['Director - Priority Of Candidate', candidate.interviewForm.directorAssessment?.priorityOfCandidate?.[0] || '-'],
      [
        'Director - Counseling Of Candidate',
        [
          candidate.interviewForm.directorAssessment?.counselingOfCandidate?.[0],
          candidate.interviewForm.directorAssessment?.counselingMode?.[0]
        ]
          .filter(Boolean)
          .join(' / ') || '-'
      ],
      ['Manager - Class Of Candidate', candidate.interviewForm.managerAssessment?.classOfCandidate?.[0] || '-'],
      ['Manager - Priority Of Candidate', candidate.interviewForm.managerAssessment?.priorityOfCandidate?.[0] || '-'],
      [
        'Manager - Counseling Of Candidate',
        [
          candidate.interviewForm.managerAssessment?.counselingOfCandidate?.[0],
          candidate.interviewForm.managerAssessment?.counselingMode?.[0]
        ]
          .filter(Boolean)
          .join(' / ') || '-'
      ]
    ]
    const height = 178
    ensureSpace(height + 18)
    drawRect(margin, y, pageWidth - margin * 2, height, { stroke: [0.83, 0.88, 0.94] })
    drawRect(margin, y, pageWidth - margin * 2, 32, { stroke: [0.83, 0.88, 0.94], fill: [0.97, 0.98, 0.99] })
    drawText('Director / Manager Assessment', margin + 12, y + 10, { size: 11, bold: true, maxWidth: pageWidth - margin * 2 - 24 })
    let rowY = y + 42
    fields.forEach(([label, value], index) => {
      if (index > 0) drawLine(margin, rowY - 7, pageWidth - margin, rowY - 7, [0.93, 0.95, 0.97], 0.6)
      drawText(`${index + 1}. ${label}`, margin + 12, rowY, { size: 9.5, bold: true, maxWidth: 210 })
      drawText(value, margin + 235, rowY, { size: 9.5, bold: true, fill: [0.02, 0.23, 0.42], maxWidth: pageWidth - margin * 2 - 250 })
      rowY += 22
    })
    y += height + 18
  }
  const drawFieldGrid = (topY) => {
    const fields = [
      ['Suitable Industry', candidate.interviewForm.suitableIndustry],
      ['Suitable Department', candidate.interviewForm.suitableDepartment],
      ['HR Interviewer', candidate.interviewForm.hrInterviewer],
      ['Remark', candidate.interviewForm.remark]
    ]
    const gap = 16
    const colW = (pageWidth - margin * 2 - gap * 2) / 3
    fields.forEach(([label, value], index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      const x = margin + col * (colW + gap)
      const fieldY = topY + row * 55
      drawText(label, x, fieldY, { size: 10, bold: true, fill: [0.2, 0.28, 0.39], maxWidth: colW })
      drawRect(x, fieldY + 18, colW, 32, { stroke: [0.78, 0.83, 0.9] })
      drawText(value, x + 8, fieldY + 27, { size: 9, bold: true, maxWidth: colW - 16 })
    })
    return 110
  }
  const drawQuestions = () => {
    const rows = buildQuestionRows(candidate.interviewForm.questions)
    const result = calculateQuestionMarksResult(candidate.interviewForm.questions, { preserveRows: true })
    const questionRowStartOffset = 62
    const questionRowHeight = 25
    const questionBottomPadding = 42
    const questionHeight = questionRowStartOffset + rows.length * questionRowHeight + questionBottomPadding
    ensureSpace(questionHeight + 18)
    drawRect(margin, y, pageWidth - margin * 2, questionHeight, { stroke: [0.06, 0.09, 0.16], lineWidth: 1.4 })
    const titleW = 230
    drawRect((pageWidth - titleW) / 2, y + 18, titleW, 22, { stroke: [0.06, 0.09, 0.16], fill: [0.06, 0.09, 0.16] })
    drawText('Interview Questions and Answers', (pageWidth - titleW) / 2 + 8, y + 22, { size: 12, bold: true, fill: [1, 1, 1], maxWidth: titleW - 16 })
    let rowY = y + questionRowStartOffset
    rows.forEach((row, index) => {
      drawText(`${index + 1}.`, margin + 18, rowY + 5, { size: 10, bold: true, maxWidth: 26 })
      drawText(row.question, margin + 52, rowY + 5, { size: 9, bold: true, maxWidth: pageWidth - margin * 2 - 180 })
      drawLine(margin + 52, rowY + 21, pageWidth - margin - 118, rowY + 21, [0.06, 0.09, 0.16], 0.8)
      const marksX = pageWidth - margin - 96
      drawRect(marksX, rowY, 78, 22, { stroke: [0.06, 0.09, 0.16] })
      drawText(row.marks ? `${row.marks}/10` : '/10', marksX + 16, rowY + 5, { size: 9, bold: true, maxWidth: 50 })
      rowY += questionRowHeight
    })
    drawText(`Total Marks: ${result.total}/${result.maxTotal} (${result.percentageLabel})`, pageWidth - margin - 210, rowY + 10, { size: 11, bold: true, fill: [0.02, 0.23, 0.42], maxWidth: 190 })
    y += questionHeight + 18
  }

  drawText('Success Interviewer Remark', margin, y, { size: 16, bold: true, maxWidth: 360 })
  y += 29
  drawLine(margin, y, pageWidth - margin, y, [0.89, 0.92, 0.96], 0.8)
  y += 22
  drawText('Candidate Name -', margin, y, { size: 12, bold: true, maxWidth: 115 })
  drawText(candidate.fullName, margin + 125, y, { size: 11, bold: true, maxWidth: pageWidth - margin * 2 - 150 })
  y += 28
  drawDirectorAssessment()
  const gap = 16
  const panelW = (pageWidth - margin * 2 - gap) / 2
  const panelHeight = drawRatingPanel('Professional Assessment', PROFESSIONAL_RATING_FIELDS, candidate.interviewForm.professionalRatings, margin, y, panelW)
  drawRatingPanel('Personality Assessment', PERSONALITY_RATING_FIELDS, candidate.interviewForm.personalityRatings, margin + panelW + gap, y, panelW)
  y += panelHeight + 20
  ensureSpace(110)
  y += drawFieldGrid(y) + 12
  drawQuestions()
  finishPage()

  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_page, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ]
  pages.forEach((content, index) => {
    const pageObject = 5 + index * 2
    const contentObject = pageObject + 1
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`
    objects[contentObject] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

const downloadBlob = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className={`${cardClass} space-y-5`}>
      <div className="flex min-w-0 items-center gap-2 border-b border-slate-100 pb-3">
        {Icon ? (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <h2 className="min-w-0 break-words text-base font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, error, className = '', children }) {
  return (
    <label className={`${labelClass} ${className}`}>
      <span>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p> : null}
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

function FormTabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-semibold sm:w-auto ${
        active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

const candidateDetailRequiredPaths = ['fullName', 'mobile']

const educationSectorOptions = ['', '10th', '12th', 'Graduate', 'PG', 'PHD', 'ITI', 'Diploma', 'Degree', 'Other']
const higherEducationYearOptions = ['', ...Array.from({ length: 67 }, (_, index) => String(new Date().getFullYear() + 4 - index))]
const educationBranchOptions = ['', 'Arts', 'Commerce', 'Science', 'Diploma/BE', 'Pharmacy', 'MBA', 'Nursing', 'ITI', 'Computer Application', 'Computer Science', 'Other']
const computerCourseOptions = ['', 'MS-CIT', 'CCC', 'Advanced Excel', 'PowerPoint', 'Tally', 'AutoCAD', 'Other']
const certificationCourseOptions = ['', 'Graphic Design', 'C++', 'Java', 'PHP', 'Python', 'Web Development', 'Digital Marketing', 'Data Analytics', 'Other']
const educationSpecializationOptions = ['', 'Chemistry', 'Microbiology', 'Physics', 'Mathematics', 'Botany', 'Zoology', 'Biotechnology', 'Biochemistry', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Computer Science', 'Information Technology', 'Accounting', 'Finance', 'Marketing', 'HR', 'Pharmacy', 'Nursing', 'Other']
const preferredDepartmentOptions = ['', 'Accounts', 'Sales', 'Quality', 'HR', 'Admin', 'Production', 'Operations', 'Purchase', 'Store', 'Logistics', 'Dispatch', 'Customer Support', 'Marketing', 'Finance', 'IT', 'Design', 'Maintenance', 'Research & Development', 'Safety', 'Front Office', 'Back Office', 'Warehouse', 'Other']
const preferredIndustryOptions = ['', 'Manufacturing', 'Banking', 'Finance', 'Insurance', 'IT', 'Non IT', 'Services', 'Educational', 'Healthcare', 'Pharmaceutical', 'Automobile', 'FMCG', 'Retail', 'Real Estate', 'Construction', 'Logistics', 'Telecom', 'Hospitality', 'Textile', 'Chemical', 'Food Processing', 'E-commerce', 'Consulting', 'Other']
const industrySpecializationOptions = ['', 'Manufacturing', 'Food', 'Pharma', 'Polymer', 'FMCG', 'Chemical', 'Cosmetics', 'Plastic', 'Engineering', 'Automobile', 'Any Industry', 'Textile', 'Packaging', 'Electrical', 'Electronics', 'Agriculture', 'Healthcare', 'Construction', 'Logistics', 'Other']
const referenceSourceOptions = ['Social Media', 'WhatsApp', 'Facebook', 'Instagram', 'LinkedIn', 'Friend', 'Relatives']

const candidateDetailPanels = [
  {
    title: 'Personal Details',
    icon: UserRound,
    fields: [
      { key: 'personal-basic-details', kind: 'section', label: 'Basic Details' },
      { path: 'fullName', label: 'Candidate Name', required: true, errorKey: 'fullName' },
      { path: 'mobile', label: 'Mobile Number', required: true, inputMode: 'numeric', maxLength: 10, digitsOnly: true, errorKey: 'mobile' },
      { path: 'whatsappNo', label: 'WhatsApp Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'email', label: 'Email ID', type: 'email' },
      { path: 'aadhaarNo', label: 'Aadhar Card Number', inputMode: 'numeric', maxLength: 12, digitsOnly: true },
      { path: 'panNo', label: 'PAN Number', maxLength: 10, uppercase: true },
      { path: 'dateOfBirth', label: 'DOB', type: 'date' },
      { path: 'currentAge', label: 'Current Age', type: 'number' },
      { path: 'gender', label: 'Gender', options: ['', 'Male', 'Female', 'Other'] },
      { path: 'marriageStatus', label: 'Marital Status', options: ['', 'Married', 'Unmarried', 'Single', 'Widow'] },
      { key: 'personal-current-address', kind: 'section', label: 'Current Address' },
      { path: 'currentAddressVillage', label: 'Current Village' },
      { path: 'currentAddressTaluka', label: 'Current Taluka' },
      { path: 'currentAddressDistrict', label: 'Current District' },
      { path: 'currentAddressState', label: 'Current State' },
      { key: 'personal-permanent-address', kind: 'section', label: 'Permanent Address' },
      { path: 'sameAsCurrentAddress', label: 'Permanent address same as current address', kind: 'checkbox', full: true },
      { path: 'permanentAddressVillage', label: 'Permanent Village', hideWhen: { path: 'sameAsCurrentAddress', value: true } },
      { path: 'permanentAddressTaluka', label: 'Permanent Taluka', hideWhen: { path: 'sameAsCurrentAddress', value: true } },
      { path: 'permanentAddressDistrict', label: 'Permanent District', hideWhen: { path: 'sameAsCurrentAddress', value: true } },
      { path: 'permanentAddressState', label: 'Permanent State', hideWhen: { path: 'sameAsCurrentAddress', value: true } },
      { key: 'personal-family-details', kind: 'section', label: 'Family Details' },
      { path: 'familyDetails.fatherOrHusbandName', label: 'Father / Husband Name' },
      { path: 'familyDetails.fatherOccupation', label: 'Father Occupation' },
      { path: 'familyDetails.fatherMobileNumber', label: 'Father Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'familyDetails.motherOrWifeName', label: 'Mother / Wife Name' },
      { path: 'familyDetails.motherOccupation', label: 'Mother Occupation' },
      { path: 'familyDetails.motherMobileNumber', label: 'Mother Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'familyDetails.siblingName', label: 'Sibling Name' },
      { path: 'familyDetails.siblingEducationOccupation', label: 'Sibling Education / Occupation' }
    ]
  },
  {
    title: 'Education Details',
    icon: GraduationCap,
    fields: [
      { key: 'education-highest', kind: 'section', label: 'Highest Education' },
      { path: 'educationSector', label: 'Highest Education', options: educationSectorOptions },
      { path: 'yearOfHigherEducation', label: 'Year of Higher Education', options: higherEducationYearOptions },
      { path: 'educationSectorOther', label: 'Other Highest Education', showWhen: { path: 'educationSector', value: 'Other' } },
      { key: 'education-branch', kind: 'section', label: 'Education Branch' },
      { path: 'educationBranch', label: 'Education Branch', options: educationBranchOptions },
      { path: 'educationBranchOther', label: 'Other Branch', showWhen: { path: 'educationBranch', value: 'Other' } },
      { key: 'education-specialization', kind: 'section', label: 'Education Specialization' },
      { path: 'educationSpecialization', label: 'Special Subject / Remark', options: educationSpecializationOptions },
      { path: 'educationSpecializationOther', label: 'Other Special Subject / Remark', showWhen: { path: 'educationSpecialization', value: 'Other' } },
      { key: 'education-institute-reference', kind: 'section', label: 'Institute Reference Details' },
      { path: 'collegeName', label: 'Institute Name' },
      { path: 'placementReference.professorName', label: 'Institute Representative Name' },
      { path: 'instituteDesignation', label: 'Designation' },
      { path: 'placementReference.professorContactNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { key: 'education-institute-address', kind: 'section', label: 'Institute Address' },
      { path: 'instituteAddressVillage', label: 'Institute Village' },
      { path: 'instituteAddressTaluka', label: 'Institute Taluka' },
      { path: 'instituteAddressDistrict', label: 'Institute District' },
      { path: 'instituteAddressState', label: 'Institute State' },
      { key: 'education-college-details', kind: 'section', label: 'Institute / College Details' },
      { path: 'college12GraduateName', label: '12th / Graduate College Name' },
      { path: 'postGraduateCollegeName', label: 'Post Graduate College Name' },
      { path: 'collegeTeacherName', label: 'Teacher' },
      { path: 'collegeDesignation', label: 'Designation' },
      { path: 'collegeMobileNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'collegeReference', label: 'Reference' },
      { key: 'education-college-address', kind: 'section', label: 'College Address' },
      { path: 'collegeAddressVillage', label: 'College Village' },
      { path: 'collegeAddressTaluka', label: 'College Taluka' },
      { path: 'collegeAddressDistrict', label: 'College District' },
      { path: 'collegeAddressState', label: 'College State' },
      { key: 'education-courses', kind: 'section', label: 'Courses & Certifications' },
      { path: 'computerCourse', label: 'Computer Courses', options: computerCourseOptions },
      { path: 'certificationCourse', label: 'Other Certification Courses', options: certificationCourseOptions },
      { path: 'computerCourseOther', label: 'Other Computer Course', showWhen: { path: 'computerCourse', value: 'Other' } },
      { path: 'certificationCourseOther', label: 'Other Certification Course', showWhen: { path: 'certificationCourse', value: 'Other' } }
    ]
  },
  {
    title: 'Professional Details',
    icon: BriefcaseBusiness,
    fields: [
      { key: 'professional-preferred-department', kind: 'section', label: 'Preferred Department' },
      { path: 'interestedDepartment', label: 'Preferred Department', options: preferredDepartmentOptions },
      { path: 'interestedDepartmentOther', label: 'Other Department', showWhen: { path: 'interestedDepartment', value: 'Other' } },
      { key: 'professional-preferred-industry', kind: 'section', label: 'Preferred Industry' },
      { path: 'preferredIndustry', label: 'Preferred Industry', options: preferredIndustryOptions },
      { path: 'preferredIndustryOther', label: 'Other Industry', showWhen: { path: 'preferredIndustry', value: 'Other' } },
      { key: 'professional-industry-specialization', kind: 'section', label: 'Industry Specialization' },
      { path: 'industrySpecialization', label: 'Industry Specialization', options: industrySpecializationOptions },
      { path: 'industrySpecializationOther', label: 'Other Industry Specialization', showWhen: { path: 'industrySpecialization', value: 'Other' } },
      { key: 'professional-current-salary', kind: 'section', label: 'Current Salary Per Month' },
      { path: 'netInHandSalary', label: 'NET / In-hand Salary' },
      { path: 'grossSalaryPerMonth', label: 'Gross Per Month' },
      { path: 'ctcSalaryPerMonth', label: 'CTC Per Month' },
      { path: 'currentJobLocation', label: 'Current Job Location' },
      { path: 'preferredJobLocation', label: 'Preferred Job Location' },
      { key: 'professional-expected-salary', kind: 'section', label: 'Expected Salary Per Month' },
      { path: 'expectedNetInHandSalary', label: 'Expected NET / In-hand Salary' },
      { path: 'expectedGrossSalaryPerMonth', label: 'Expected Gross Per Month' },
      { path: 'expectedCtcSalaryPerMonth', label: 'Expected CTC Per Month' },
      { key: 'professional-working-status', kind: 'section', label: 'Job Working Status' },
      { path: 'jobWorkingStatus', label: 'Job Working Status', options: ['', 'Working', 'Jobless'] },
      { key: 'professional-experience', kind: 'section', label: 'Total Years of Experience' },
      { path: 'experienceType', label: 'Total Year of Experience', options: ['', 'Fresher', 'Experience'] },
      { path: 'totalExperience', label: 'Enter Experience', type: 'number', showWhen: { path: 'experienceType', value: 'Experience' } },
      { key: 'professional-notice-period', kind: 'section', label: 'Notice Period' },
      { path: 'noticePeriod', label: 'Notice Period', options: ['', 'Immediate Joiner', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Other'] },
      { path: 'noticePeriodOther', label: 'Other Notice Period', showWhen: { path: 'noticePeriod', value: 'Other' } },
      { key: 'professional-job-change', kind: 'section', label: 'Reason for Job Change' },
      { path: 'reasonForJobChange', label: 'Reason For Job Change', options: ['', 'Looking for financial and personal growth', 'Looking for opportunity in native place', 'Facing challenge in current company', 'Any Other'] },
      { path: 'reasonForJobChangeOther', label: 'Other Reason', showWhen: { path: 'reasonForJobChange', value: 'Any Other' } },
      { key: 'professional-skills', kind: 'section', label: 'Key Skills / Knowledge' },
      { path: 'keySkillsKnowledge', label: 'Key skills / knowledge you have, especially for fresher' },
      { key: 'professional-responsibility', kind: 'section', label: 'Key Job Responsibility' },
      { path: 'careerJobResponsibilities', label: 'Key job responsibility you handled in your career experience' }
    ]
  },
  {
    title: 'Reference Success Details',
    icon: Handshake,
    fields: [
      { key: 'reference-details', kind: 'section', label: 'Reference Details' },
      { path: 'advisorCode', label: 'Business Advisor Code' },
      { path: 'placementReference.referenceBy', label: 'Reference Name' },
      { path: 'placementReference.referenceContactNumber', label: 'Reference Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'referenceProfile', label: 'Reference Profile', options: ['', 'Professional', 'Farmer', 'Student', 'Other'] },
      { path: 'referenceProfileOther', label: 'Other Reference Profile', showWhen: { path: 'referenceProfile', value: 'Other' } },
      { key: 'reference-source', kind: 'section', label: 'Reference Source' },
      { path: 'referenceSources', label: 'Reference Source', kind: 'checkboxes', options: referenceSourceOptions, full: true }
    ]
  }
]

const getCandidatePathValue = (candidate, path) => {
  if (!path) return ''
  return path.split('.').reduce((acc, key) => (acc == null ? '' : acc[key]), candidate) ?? ''
}

const createCandidateDetailsPdf = (candidate) => {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 32
  const gap = 14
  const fieldWidth = (pageWidth - margin * 2 - gap) / 2
  const pages = []
  let ops = []
  let y = margin

  const pdfY = (topY) => pageHeight - topY
  const color = ([r, g, b]) => `${r} ${g} ${b}`
  const add = (value) => ops.push(value)
  const wrapLines = (text, size, maxWidth) => {
    const words = pdfPlainText(text || '-').split(' ').filter(Boolean)
    const lines = []
    let line = ''
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word
      if (next.length * size * 0.52 <= maxWidth || !line) {
        line = next
      } else {
        lines.push(line)
        line = word
      }
    })
    if (line) lines.push(line)
    return lines.length ? lines : ['-']
  }
  const drawText = (text, x, topY, { size = 9.5, bold = false, fill = [0.06, 0.09, 0.16], maxWidth = 120, lineHeight = size * 1.25 } = {}) => {
    const lines = wrapLines(text, size, maxWidth)
    lines.forEach((line, index) => {
      add(`BT ${color(fill)} rg /F${bold ? 2 : 1} ${size} Tf ${x.toFixed(2)} ${pdfY(topY + size + index * lineHeight).toFixed(2)} Td (${escapePdfText(line)}) Tj ET`)
    })
    return lines.length * lineHeight
  }
  const drawRect = (x, topY, width, height, { stroke = [0.82, 0.86, 0.92], fill = null, lineWidth = 0.8 } = {}) => {
    add(`q ${lineWidth} w`)
    if (fill) add(`${color(fill)} rg`)
    if (stroke) add(`${color(stroke)} RG`)
    add(`${x.toFixed(2)} ${(pageHeight - topY - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`)
    add('Q')
  }
  const drawLine = (x1, y1, x2, y2, stroke = [0.86, 0.89, 0.94], lineWidth = 0.8) => {
    add(`q ${lineWidth} w ${color(stroke)} RG ${x1.toFixed(2)} ${pdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${pdfY(y2).toFixed(2)} l S Q`)
  }
  const pushPage = () => {
    if (ops.length) pages.push(ops.join('\n'))
    ops = []
    y = margin
  }
  const addContinuedHeader = () => {
    drawText('Candidate Job Application Details', margin, y, { size: 12, bold: true, maxWidth: 260 })
    drawText('Continued', pageWidth - margin - 75, y + 1, { size: 8.5, bold: true, fill: [0.39, 0.48, 0.61], maxWidth: 75 })
    y += 24
    drawLine(margin, y, pageWidth - margin, y)
    y += 18
  }
  const ensureSpace = (height) => {
    if (y + height <= pageHeight - margin) return
    pushPage()
    addContinuedHeader()
  }
  const formatValue = (field) => {
    const value = getCandidatePathValue(candidate, field.path)
    if (field.kind === 'checkbox') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
    return String(value ?? '').trim() || '-'
  }
  const fieldHeight = (label, value) => {
    const labelLines = wrapLines(label, 7.5, fieldWidth - 18)
    const valueLines = wrapLines(value, 9.5, fieldWidth - 18)
    return Math.max(45, 16 + labelLines.length * 9.5 + valueLines.length * 12)
  }
  const drawField = (field, x, topY, height) => {
    const label = field.label
    const value = formatValue(field)
    drawRect(x, topY, fieldWidth, height, { fill: [1, 1, 1] })
    const labelUsed = drawText(label, x + 9, topY + 8, { size: 7.5, bold: true, fill: [0.32, 0.4, 0.52], maxWidth: fieldWidth - 18, lineHeight: 9.5 })
    drawText(value, x + 9, topY + 11 + labelUsed, { size: 9.5, bold: true, maxWidth: fieldWidth - 18 })
  }

  drawText('Candidate Job Application Details', margin, y, { size: 16, bold: true, maxWidth: 330 })
  y += 24
  drawText(`Candidate ID: ${candidate.candidateCode || '-'}`, margin, y, { size: 9.5, bold: true, fill: [0.32, 0.4, 0.52], maxWidth: 240 })
  drawText(`Exported: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin - 180, y, { size: 8.5, fill: [0.32, 0.4, 0.52], maxWidth: 180 })
  y += 22
  drawLine(margin, y, pageWidth - margin, y)
  y += 18

  candidateDetailPanels.forEach((panel) => {
    ensureSpace(38)
    drawRect(margin, y, pageWidth - margin * 2, 24, { stroke: [0.1, 0.49, 0.78], fill: [0.93, 0.97, 1] })
    drawText(panel.title, margin + 10, y + 6, { size: 11, bold: true, fill: [0.02, 0.23, 0.42], maxWidth: pageWidth - margin * 2 - 20 })
    y += 34

    let col = 0
    let rowHeight = 0

    panel.fields.forEach((field) => {
      if (field.showWhen && getCandidatePathValue(candidate, field.showWhen.path) !== field.showWhen.value) return
      if (field.hideWhen && getCandidatePathValue(candidate, field.hideWhen.path) === field.hideWhen.value) return

      if (field.kind === 'section') {
        if (col !== 0) {
          y += rowHeight + 8
          col = 0
          rowHeight = 0
        }
        ensureSpace(26)
        drawText(field.label, margin, y, { size: 9.5, bold: true, fill: [0.06, 0.09, 0.16], maxWidth: pageWidth - margin * 2 })
        y += 17
        return
      }

      const value = formatValue(field)
      const height = fieldHeight(field.label, value)
      if (col === 0) ensureSpace(height + 8)
      const x = margin + col * (fieldWidth + gap)
      drawField(field, x, y, height)
      rowHeight = Math.max(rowHeight, height)
      col += 1

      if (col === 2) {
        y += rowHeight + 8
        col = 0
        rowHeight = 0
      }
    })

    if (col !== 0) y += rowHeight + 8
    y += 8
  })

  pushPage()

  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_page, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ]
  pages.forEach((content, index) => {
    const pageObject = 5 + index * 2
    const contentObject = pageObject + 1
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`
    objects[contentObject] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

const createSuccessInfoPdf = (candidate) => {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 32
  const gap = 14
  const fieldWidth = (pageWidth - margin * 2 - gap) / 2
  const pages = []
  let ops = []
  let y = margin

  const pdfY = (topY) => pageHeight - topY
  const color = ([r, g, b]) => `${r} ${g} ${b}`
  const add = (value) => ops.push(value)
  const wrapLines = (text, size, maxWidth) => {
    const words = pdfPlainText(text || '-').split(' ').filter(Boolean)
    const lines = []
    let line = ''
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word
      if (next.length * size * 0.52 <= maxWidth || !line) {
        line = next
      } else {
        lines.push(line)
        line = word
      }
    })
    if (line) lines.push(line)
    return lines.length ? lines : ['-']
  }
  const drawText = (text, x, topY, { size = 9.5, bold = false, fill = [0.06, 0.09, 0.16], maxWidth = 120, lineHeight = size * 1.25 } = {}) => {
    const lines = wrapLines(text, size, maxWidth)
    lines.forEach((line, index) => {
      add(`BT ${color(fill)} rg /F${bold ? 2 : 1} ${size} Tf ${x.toFixed(2)} ${pdfY(topY + size + index * lineHeight).toFixed(2)} Td (${escapePdfText(line)}) Tj ET`)
    })
    return lines.length * lineHeight
  }
  const drawRect = (x, topY, width, height, { stroke = [0.82, 0.86, 0.92], fill = null, lineWidth = 0.8 } = {}) => {
    add(`q ${lineWidth} w`)
    if (fill) add(`${color(fill)} rg`)
    if (stroke) add(`${color(stroke)} RG`)
    add(`${x.toFixed(2)} ${(pageHeight - topY - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`)
    add('Q')
  }
  const drawLine = (x1, y1, x2, y2, stroke = [0.86, 0.89, 0.94], lineWidth = 0.8) => {
    add(`q ${lineWidth} w ${color(stroke)} RG ${x1.toFixed(2)} ${pdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${pdfY(y2).toFixed(2)} l S Q`)
  }
  const pushPage = () => {
    if (ops.length) pages.push(ops.join('\n'))
    ops = []
    y = margin
  }
  const addContinuedHeader = () => {
    drawText('Success Info For Candidate', margin, y, { size: 12, bold: true, maxWidth: 260 })
    drawText('Continued', pageWidth - margin - 75, y + 1, { size: 8.5, bold: true, fill: [0.39, 0.48, 0.61], maxWidth: 75 })
    y += 24
    drawLine(margin, y, pageWidth - margin, y)
    y += 18
  }
  const ensureSpace = (height) => {
    if (y + height <= pageHeight - margin) return
    pushPage()
    addContinuedHeader()
  }
  const fieldHeight = (label, value) => {
    const labelLines = wrapLines(label, 7.5, fieldWidth - 18)
    const valueLines = wrapLines(value, 9.5, fieldWidth - 18)
    return Math.max(45, 16 + labelLines.length * 9.5 + valueLines.length * 12)
  }
  const drawField = (label, value, x, topY, height) => {
    drawRect(x, topY, fieldWidth, height, { fill: [1, 1, 1] })
    const labelUsed = drawText(label, x + 9, topY + 8, { size: 7.5, bold: true, fill: [0.32, 0.4, 0.52], maxWidth: fieldWidth - 18, lineHeight: 9.5 })
    drawText(value || '-', x + 9, topY + 11 + labelUsed, { size: 9.5, bold: true, maxWidth: fieldWidth - 18 })
  }

  drawText('Success Info For Candidate', margin, y, { size: 16, bold: true, maxWidth: 330 })
  y += 24
  drawText(`Candidate ID: ${candidate.candidateCode || '-'}`, margin, y, { size: 9.5, bold: true, fill: [0.32, 0.4, 0.52], maxWidth: 240 })
  drawText(`Exported: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin - 180, y, { size: 8.5, fill: [0.32, 0.4, 0.52], maxWidth: 180 })
  y += 22
  drawLine(margin, y, pageWidth - margin, y)
  y += 18

  const summaryFields = [
    ['Candidate Name', candidate.fullName],
    ['Mobile Number', candidate.mobile]
  ]
  let col = 0
  let rowHeight = 0
  summaryFields.forEach(([label, rawValue]) => {
    const value = String(rawValue ?? '').trim() || '-'
    const height = fieldHeight(label, value)
    if (col === 0) ensureSpace(height + 8)
    drawField(label, value, margin + col * (fieldWidth + gap), y, height)
    rowHeight = Math.max(rowHeight, height)
    col += 1
    if (col === 2) {
      y += rowHeight + 8
      col = 0
      rowHeight = 0
    }
  })
  if (col !== 0) y += rowHeight + 8

  ensureSpace(38)
  drawRect(margin, y + 8, pageWidth - margin * 2, 24, { stroke: [0.1, 0.49, 0.78], fill: [0.93, 0.97, 1] })
  drawText('Success Information', margin + 10, y + 14, { size: 11, bold: true, fill: [0.02, 0.23, 0.42], maxWidth: pageWidth - margin * 2 - 20 })
  y += 42

  col = 0
  rowHeight = 0
  SUCCESS_INFO_FIELDS.forEach((field) => {
    const value = String(candidate.successInfo?.[field.key] ?? '').trim() || '-'
    const height = fieldHeight(field.label, value)
    if (col === 0) ensureSpace(height + 8)
    drawField(field.label, value, margin + col * (fieldWidth + gap), y, height)
    rowHeight = Math.max(rowHeight, height)
    col += 1
    if (col === 2) {
      y += rowHeight + 8
      col = 0
      rowHeight = 0
    }
  })
  if (col !== 0) y += rowHeight + 8

  pushPage()

  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_page, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ]
  pages.forEach((content, index) => {
    const pageObject = 5 + index * 2
    const contentObject = pageObject + 1
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`
    objects[contentObject] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

const createCompanyInterviewPdf = (candidate, interview) => {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 32
  const gap = 14
  const fieldWidth = (pageWidth - margin * 2 - gap) / 2
  const pages = []
  let ops = []
  let y = margin

  const pdfY = (topY) => pageHeight - topY
  const color = ([r, g, b]) => `${r} ${g} ${b}`
  const add = (value) => ops.push(value)
  const wrapLines = (text, size, maxWidth) => {
    const words = pdfPlainText(text || '-').split(' ').filter(Boolean)
    const lines = []
    let line = ''
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word
      if (next.length * size * 0.52 <= maxWidth || !line) {
        line = next
      } else {
        lines.push(line)
        line = word
      }
    })
    if (line) lines.push(line)
    return lines.length ? lines : ['-']
  }
  const drawText = (text, x, topY, { size = 9.5, bold = false, fill = [0.06, 0.09, 0.16], maxWidth = 120, lineHeight = size * 1.25 } = {}) => {
    const lines = wrapLines(text, size, maxWidth)
    lines.forEach((line, index) => {
      add(`BT ${color(fill)} rg /F${bold ? 2 : 1} ${size} Tf ${x.toFixed(2)} ${pdfY(topY + size + index * lineHeight).toFixed(2)} Td (${escapePdfText(line)}) Tj ET`)
    })
    return lines.length * lineHeight
  }
  const drawRect = (x, topY, width, height, { stroke = [0.82, 0.86, 0.92], fill = null, lineWidth = 0.8 } = {}) => {
    add(`q ${lineWidth} w`)
    if (fill) add(`${color(fill)} rg`)
    if (stroke) add(`${color(stroke)} RG`)
    add(`${x.toFixed(2)} ${(pageHeight - topY - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`)
    add('Q')
  }
  const drawLine = (x1, y1, x2, y2, stroke = [0.86, 0.89, 0.94], lineWidth = 0.8) => {
    add(`q ${lineWidth} w ${color(stroke)} RG ${x1.toFixed(2)} ${pdfY(y1).toFixed(2)} m ${x2.toFixed(2)} ${pdfY(y2).toFixed(2)} l S Q`)
  }
  const pushPage = () => {
    if (ops.length) pages.push(ops.join('\n'))
    ops = []
    y = margin
  }
  const addContinuedHeader = () => {
    drawText('Company Interview Details', margin, y, { size: 12, bold: true, maxWidth: 260 })
    drawText('Continued', pageWidth - margin - 75, y + 1, { size: 8.5, bold: true, fill: [0.39, 0.48, 0.61], maxWidth: 75 })
    y += 24
    drawLine(margin, y, pageWidth - margin, y)
    y += 18
  }
  const ensureSpace = (height) => {
    if (y + height <= pageHeight - margin) return
    pushPage()
    addContinuedHeader()
  }
  const fieldHeight = (label, value, width = fieldWidth) => {
    const labelLines = wrapLines(label, 7.5, width - 18)
    const valueLines = wrapLines(value, 9.5, width - 18)
    return Math.max(45, 16 + labelLines.length * 9.5 + valueLines.length * 12)
  }
  const drawField = (label, value, x, topY, height, width = fieldWidth) => {
    drawRect(x, topY, width, height, { fill: [1, 1, 1] })
    const labelUsed = drawText(label, x + 9, topY + 8, { size: 7.5, bold: true, fill: [0.32, 0.4, 0.52], maxWidth: width - 18, lineHeight: 9.5 })
    drawText(value || '-', x + 9, topY + 11 + labelUsed, { size: 9.5, bold: true, maxWidth: width - 18 })
  }
  const drawSectionTitle = (title) => {
    ensureSpace(38)
    drawRect(margin, y, pageWidth - margin * 2, 24, { stroke: [0.1, 0.49, 0.78], fill: [0.93, 0.97, 1] })
    drawText(title, margin + 10, y + 6, { size: 11, bold: true, fill: [0.02, 0.23, 0.42], maxWidth: pageWidth - margin * 2 - 20 })
    y += 34
  }
  const drawTwoColumnFields = (fields) => {
    let col = 0
    let rowHeight = 0
    fields.forEach(([label, rawValue]) => {
      const value = String(rawValue ?? '').trim() || '-'
      const height = fieldHeight(label, value)
      if (col === 0) ensureSpace(height + 8)
      drawField(label, value, margin + col * (fieldWidth + gap), y, height)
      rowHeight = Math.max(rowHeight, height)
      col += 1
      if (col === 2) {
        y += rowHeight + 8
        col = 0
        rowHeight = 0
      }
    })
    if (col !== 0) y += rowHeight + 8
  }
  const documentsByType = groupInterviewDocumentsByType(interview.documents)
  const documentFields = interviewDocumentTypes.map((item) => {
    const docs = documentsByType[item.key] || []
    return [
      item.label,
      docs.length ? docs.map((doc) => doc.fileName || doc.documentLabel || 'Uploaded file').join(', ') : 'Not uploaded'
    ]
  })

  drawText('Company Interview Details', margin, y, { size: 16, bold: true, maxWidth: 330 })
  y += 24
  drawText(`Candidate ID: ${candidate.candidateCode || '-'}`, margin, y, { size: 9.5, bold: true, fill: [0.32, 0.4, 0.52], maxWidth: 240 })
  drawText(`Exported: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin - 180, y, { size: 8.5, fill: [0.32, 0.4, 0.52], maxWidth: 180 })
  y += 22
  drawLine(margin, y, pageWidth - margin, y)
  y += 18

  drawSectionTitle('Candidate')
  drawTwoColumnFields([
    ['Candidate Name', interview.candidateName || candidate.fullName],
    ['Mobile Number', candidate.mobile],
    ['Company Name', interview.companyName],
    ['Job Role/Department', interview.jobRole]
  ])

  drawSectionTitle('Interview Update')
  drawTwoColumnFields([
    ['Reference', interview.referencePerson || 'Walk-in'],
    ['Date Of Interview', interview.date],
    ['Attend Interview', interview.attendInterview],
    ['Interested For Join', interview.interestedForJoin],
    ['Selection Chances', interview.selectionChances],
    ['Selection Status', interview.status],
    ['Rating For Company (/5)', interview.ratingForCompany],
    ['Update By', interview.updatedBy]
  ])

  drawSectionTitle('Discussion And Feedback')
  ;[
    ['Not Attend Remark', interview.notAttendRemark],
    ['IF Not Interested Reason', interview.notInterestedReason],
    ['Reply From Company', interview.replyFromCompany],
    ['Positive Feedback', interview.positiveFeedback],
    ['Negative Feedback', interview.negativeFeedback],
    ['Overall Discussion', interview.overallDiscussion],
    ['Note', interview.note]
  ].forEach(([label, rawValue]) => {
    const value = String(rawValue ?? '').trim() || '-'
    const height = fieldHeight(label, value, pageWidth - margin * 2)
    ensureSpace(height + 8)
    drawField(label, value, margin, y, height, pageWidth - margin * 2)
    y += height + 8
  })

  drawSectionTitle('Interview Documents')
  drawTwoColumnFields(documentFields)

  pushPage()

  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_page, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ]
  pages.forEach((content, index) => {
    const pageObject = 5 + index * 2
    const contentObject = pageObject + 1
    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`
    objects[contentObject] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

const normalizeApplicationFieldValue = (field, value) => {
  let next = String(value ?? '')
  if (field.digitsOnly) next = next.replace(/\D/g, '')
  if (field.uppercase) next = next.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (field.maxLength) next = next.slice(0, field.maxLength)
  return next
}

function CandidateApplicationField({ field, candidate, errors, onPathChange }) {
  if (field.showWhen && getCandidatePathValue(candidate, field.showWhen.path) !== field.showWhen.value) return null
  if (field.hideWhen && getCandidatePathValue(candidate, field.hideWhen.path) === field.hideWhen.value) return null

  if (field.kind === 'section') {
    return (
      <div className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0 md:col-span-2 xl:col-span-3">
        <h3 className="text-sm font-bold text-slate-800">{field.label}</h3>
      </div>
    )
  }

  const value = getCandidatePathValue(candidate, field.path)
  const className = field.full ? 'md:col-span-2 xl:col-span-3' : field.kind === 'area' ? 'md:col-span-2' : ''
  const error = field.errorKey ? errors[field.errorKey] : ''

  return (
    <Field label={field.label} required={field.required} error={error} className={className}>
      {field.kind === 'checkbox' ? (
        <label className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onPathChange(field.path, event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          {field.label}
        </label>
      ) : field.kind === 'checkboxes' ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {(field.options || []).map((option) => {
            const checked = Array.isArray(value) && value.includes(option)
            return (
              <label key={option} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const current = Array.isArray(value) ? value : []
                    onPathChange(field.path, checked ? current.filter((item) => item !== option) : [...current, option])
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {option}
              </label>
            )
          })}
        </div>
      ) : field.options ? (
        <select
          value={value || ''}
          onChange={(event) => onPathChange(field.path, normalizeApplicationFieldValue(field, event.target.value))}
          className={inputClass}
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
          value={value || ''}
          onChange={(event) => onPathChange(field.path, normalizeApplicationFieldValue(field, event.target.value))}
          className={textAreaClass}
        />
      ) : (
        <input
          type={field.type || 'text'}
          value={value || ''}
          min={field.type === 'number' ? '0' : undefined}
          inputMode={field.inputMode}
          maxLength={field.maxLength}
          onChange={(event) => onPathChange(field.path, normalizeApplicationFieldValue(field, event.target.value))}
          className={`${inputClass} ${error ? 'border-rose-400' : ''}`}
        />
      )}
    </Field>
  )
}

const isCandidateApplicationFieldVisible = (field, candidate) => {
  if (field.showWhen && getCandidatePathValue(candidate, field.showWhen.path) !== field.showWhen.value) return false
  if (field.hideWhen && getCandidatePathValue(candidate, field.hideWhen.path) === field.hideWhen.value) return false
  return field.kind !== 'section'
}

const groupCandidateApplicationFields = (panel, candidate) => {
  const groups = []
  let currentGroup = { title: 'Details', fields: [] }

  panel.fields.forEach((field) => {
    if (field.kind === 'section') {
      if (currentGroup.fields.length) groups.push(currentGroup)
      currentGroup = { title: field.label, fields: [] }
      return
    }

    if (isCandidateApplicationFieldVisible(field, candidate)) {
      currentGroup.fields.push(field)
    }
  })

  if (currentGroup.fields.length) groups.push(currentGroup)
  return groups
}

function CandidateDetailsSidebar({ currentStep, progress, candidate, onStep }) {
  const completedRequired = candidateDetailRequiredPaths.filter((path) => String(getCandidatePathValue(candidate, path) || '').trim()).length
  const referenceLabel =
    String(candidate.advisorCode || '').trim() ||
    String(candidate.referenceName || '').trim() ||
    String(candidate.placementReference?.referenceBy || '').trim() ||
    'Walk-in'
  const documentLabel = candidate.documents?.length ? `${candidate.documents.length} uploaded` : 'Optional'

  return (
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
        {candidateDetailPanels.map((panel, index) => {
          const PanelIcon = panel.icon
          const active = index === currentStep
          const complete = index < currentStep
          return (
            <button
              key={panel.title}
              type="button"
              onClick={() => onStep(index)}
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
        <div className="flex justify-between gap-3"><span>Required</span><strong className="text-slate-950">{completedRequired}/{candidateDetailRequiredPaths.length}</strong></div>
        <div className="flex justify-between gap-3"><span>Reference</span><strong className="truncate text-slate-950">{referenceLabel}</strong></div>
        <div className="flex justify-between gap-3"><span>Documents</span><strong className="text-slate-950">{documentLabel}</strong></div>
      </div>
    </aside>
  )
}

function CandidateDetailsApplicationPanel({ candidate, errors, currentStep, onStep, onPathChange }) {
  const panel = candidateDetailPanels[currentStep] || candidateDetailPanels[0]
  const panelGroups = groupCandidateApplicationFields(panel, candidate)
  const PanelIcon = panel.icon
  const progress = Math.round(((currentStep + 1) / candidateDetailPanels.length) * 100)
  const isFirst = currentStep === 0
  const isLast = currentStep === candidateDetailPanels.length - 1

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <CandidateDetailsSidebar currentStep={currentStep} progress={progress} candidate={candidate} onStep={onStep} />

      <div className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
          <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <PanelIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-sky-700">Step {currentStep + 1} of {candidateDetailPanels.length}</p>
                <h2 className="mt-0.5 text-lg font-bold leading-7 text-slate-950 sm:text-xl">{panel.title}</h2>
              </div>
            </div>
          </header>
          <div className="space-y-6 px-4 py-5 sm:px-6">
            {panelGroups.map((group) => (
              <section key={group.title} className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
                <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.fields.map((field) => (
                    <CandidateApplicationField
                      key={field.key || field.path}
                      field={field}
                      candidate={candidate}
                      errors={errors}
                      onPathChange={onPathChange}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onStep(Math.max(currentStep - 1, 0))}
              disabled={isFirst}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-32"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => onStep(Math.min(currentStep + 1, candidateDetailPanels.length - 1))}
              disabled={isLast}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateDocumentsPanel({
  documentsByType,
  documentsByTypeList,
  documentCountsByType,
  extraDocuments,
  uploadingDocumentType,
  deletingDocumentId,
  uploadDocuments,
  viewDocument,
  downloadDocument,
  removeDocument
}) {
  const [activeDocumentType, setActiveDocumentType] = useState('')
  const [documentSearchTerm, setDocumentSearchTerm] = useState('')
  const normalizedDocumentSearchTerm = normalizeDocumentSearch(documentSearchTerm)
  const matchesDocumentType = (item, label = item.label, groupTitle = '') =>
    documentMatchesSearch({
      item,
      label,
      docs: documentsByTypeList[item.key] || [],
      term: normalizedDocumentSearchTerm,
      groupTitle
    })
  const filteredCandidateDocumentTypes = candidateDocumentTypes.filter((item) => matchesDocumentType(item, item.label, 'Candidate Documents'))
  const filteredSuccessDocumentTypes = successDocumentTypes.filter((item) => matchesDocumentType(item, item.label, 'Success Documents'))
  const filteredExtraDocuments = extraDocuments.filter((doc) => extraDocumentMatchesSearch(doc, normalizedDocumentSearchTerm))
  const hasVisibleDocuments =
    filteredCandidateDocumentTypes.length > 0 ||
    filteredSuccessDocumentTypes.length > 0 ||
    filteredExtraDocuments.length > 0
  const activeDocumentItem = allCandidateDocumentTypes.find((item) => item.key === activeDocumentType)
  const activeDocuments = activeDocumentType ? documentsByTypeList[activeDocumentType] || [] : []
  const uploadCardProps = {
    documentsByType,
    documentsByTypeList,
    documentCountsByType,
    uploadingDocumentType,
    deletingDocumentId,
    uploadDocuments,
    viewDocument,
    downloadDocument,
    removeDocument,
    openDocumentsDialog: setActiveDocumentType
  }

  return (
    <>
      <Section title="Candidate Documents" icon={Upload}>
        <p className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">JPG/PNG images and PDF letters where applicable. Max 10MB each.</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={documentSearchTerm}
            onChange={(event) => setDocumentSearchTerm(event.target.value)}
            placeholder="Search documents by name, type, or uploaded file"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCandidateDocumentTypes.map((item) => (
            <CandidateDocumentUploadCard key={item.key} item={item} {...uploadCardProps} />
          ))}
        </div>

        {filteredExtraDocuments.length ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-500">Other Uploaded Documents</p>
            <div className="grid gap-2 md:grid-cols-2">
              {filteredExtraDocuments.map((doc, index) => {
                const docId = String(doc?._id || '')
                const deleting = deletingDocumentId && deletingDocumentId === docId
                return (
                  <div key={docId || `${doc.fileUrl || 'doc'}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="truncate text-xs font-semibold text-slate-700">{doc?.documentLabel || doc?.fileName || 'Uploaded document'}</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className={`inline-flex h-7 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-semibold ${
                          docId ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                        onClick={(event) => {
                          event.preventDefault()
                          if (!docId) return
                          viewDocument(doc)
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        disabled={!docId}
                        onClick={() => downloadDocument(doc)}
                        className={`inline-flex h-7 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-semibold ${
                          docId ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                      <button
                        type="button"
                        disabled={!docId || deleting}
                        onClick={() => removeDocument(docId)}
                        className={`inline-flex h-7 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-semibold ${
                          docId ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Success Documents" icon={Upload}>
        <p className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">Success and joining documents. Videos are allowed only where applicable.</p>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuccessDocumentTypes.map((item) => (
            <CandidateDocumentUploadCard key={item.key} item={item} {...uploadCardProps} />
          ))}
        </div>
      </Section>

      {!hasVisibleDocuments ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          No documents matched your search.
        </div>
      ) : null}

      {activeDocumentItem ? (
        <CandidateDocumentFilesDialog
          item={activeDocumentItem}
          docs={activeDocuments}
          deletingDocumentId={deletingDocumentId}
          viewDocument={viewDocument}
          downloadDocument={downloadDocument}
          removeDocument={removeDocument}
          onClose={() => setActiveDocumentType('')}
        />
      ) : null}
    </>
  )
}

function CandidateDocumentUploadCard({
  item,
  label,
  className = 'bg-white',
  documentsByType,
  documentsByTypeList,
  documentCountsByType,
  uploadingDocumentType,
  deletingDocumentId,
  uploadDocuments,
  viewDocument,
  downloadDocument,
  removeDocument,
  openDocumentsDialog
}) {
  const uploadedDoc = documentsByType[item.key]
  const uploadedDocs = documentsByTypeList[item.key] || []
  const uploading = uploadingDocumentType === item.key
  const inputId = `document-upload-${item.key}`
  const uploadedCount = documentCountsByType[item.key] || 0
  const allowMultiple = educationCertificateDocumentKeys.has(item.key) || computerCourseDocumentKeys.has(item.key)
  const hasDocuments = uploadedDocs.length > 0
  const firstDoc = uploadedDocs[0]
  const firstDocId = String(firstDoc?._id || '')
  const isDeletingFirstDoc = firstDocId && deletingDocumentId === firstDocId

  const handleView = () => {
    if (!hasDocuments) return
    if (uploadedDocs.length === 1) {
      viewDocument(firstDoc)
      return
    }
    openDocumentsDialog(item.key)
  }

  const handleDelete = () => {
    if (!hasDocuments) return
    if (uploadedDocs.length === 1 && firstDocId) {
      removeDocument(firstDocId)
      return
    }
    openDocumentsDialog(item.key)
  }

  return (
    <div className={`rounded-lg border border-slate-200 p-2.5 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-5 text-slate-900">{label || item.label}</p>
          {item.description ? <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">{item.description}</p> : null}
          <p className={`mt-0.5 text-xs font-semibold ${uploadedDoc ? 'text-emerald-700' : 'text-amber-700'}`}>
            {uploadedDoc ? 'Provided' : 'Not provided'}
          </p>
          {uploadedDoc?.fileName ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{uploadedDoc.fileName}</p> : null}
          {uploadedCount > 1 ? <p className="mt-0.5 text-[11px] font-semibold text-indigo-600">{uploadedCount} files uploaded</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <button
            type="button"
            disabled={!hasDocuments}
            onClick={handleView}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-bold ${
              hasDocuments ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <button
            type="button"
            disabled={!hasDocuments || (uploadedDocs.length === 1 && !firstDocId) || isDeletingFirstDoc}
            onClick={handleDelete}
            className={`inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-bold ${
              hasDocuments ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeletingFirstDoc ? 'Deleting...' : 'Delete'}
          </button>
          <label
            htmlFor={inputId}
            className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-2.5 text-xs font-bold ${
              uploading ? 'text-slate-400' : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </label>
        </div>
      </div>

      <input
        id={inputId}
        type="file"
        accept={item.accept || 'image/jpeg,image/png'}
        multiple={allowMultiple}
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          uploadDocuments(item.key, event.target.files)
          event.target.value = ''
        }}
      />

    </div>
  )
}

function CandidateDocumentFilesDialog({
  item,
  docs,
  deletingDocumentId,
  viewDocument,
  downloadDocument,
  removeDocument,
  onClose
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{educationCertificateDocumentKeys.has(item.key) ? educationCertificateLabel(item) : item.label}</p>
            <p className="text-xs font-semibold text-slate-500">{docs.length} uploaded file{docs.length === 1 ? '' : 's'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Close documents"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-4">
          <div className="space-y-2">
            {docs.map((doc, index) => {
              const docId = String(doc?._id || '')
              const deleting = deletingDocumentId && deletingDocumentId === docId
              return (
                <div key={docId || doc.fileUrl || index} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{doc.fileName || doc.documentLabel || `Uploaded file ${index + 1}`}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">{doc.documentLabel || item.label}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        onClose()
                        viewDocument(doc)
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      type="button"
                      disabled={!docId}
                      onClick={() => downloadDocument(doc)}
                      className={`inline-flex h-8 items-center justify-center gap-1 rounded-md border px-3 text-xs font-bold ${
                        docId ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      disabled={!docId || deleting}
                      onClick={() => {
                        onClose()
                        removeDocument(docId)
                      }}
                      className={`inline-flex h-8 items-center justify-center gap-1 rounded-md border px-3 text-xs font-bold ${
                        docId ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function InterviewDocumentsPanel({
  draft,
  mode = 'edit',
  saving,
  pendingFiles = {},
  uploadingDocumentType = '',
  deletingDocumentId = '',
  onDocumentSelect,
  onPendingDocumentRemove,
  onDocumentView,
  onDocumentDownload,
  onDocumentDelete
}) {
  if (!draft) return null

  const readOnly = mode === 'view'
  const documentsByType = groupInterviewDocumentsByType(draft.documents)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Interview Documents</h4>
          <p className="text-xs font-semibold text-slate-500">Appointment, offer, interview, and confirmation letters. JPG, PNG, or PDF up to 10MB.</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {interviewDocumentTypes.map((item) => {
          const docs = documentsByType[item.key] || []
          const stagedFiles = pendingFiles[item.key] || []
          const inputId = `interview-document-${draft.id || 'new'}-${item.key}`
          const uploading = uploadingDocumentType === item.key

          return (
            <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className={`mt-0.5 text-xs font-semibold ${docs.length || stagedFiles.length ? 'text-emerald-700' : 'text-orange-700'}`}>
                    {docs.length || stagedFiles.length ? `${docs.length + stagedFiles.length} file${docs.length + stagedFiles.length === 1 ? '' : 's'}` : 'Not uploaded'}
                  </p>
                </div>
                {!readOnly ? (
                  <>
                    <input
                      id={inputId}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        onDocumentSelect?.(item.key, event.target.files)
                        event.target.value = ''
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md border px-3 text-xs font-bold ${
                        uploading || saving ? 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400' : 'border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </label>
                  </>
                ) : null}
              </div>

              <div className="mt-2 space-y-1.5">
                {docs.map((doc) => {
                  const docId = String(doc?._id || '')
                  const deleting = deletingDocumentId === docId
                  return (
                    <div key={docId || doc.fileUrl} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                      <p className="truncate text-[11px] font-semibold text-slate-700">{doc.fileName || doc.documentLabel || 'Uploaded file'}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="inline-flex h-6 items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => onDocumentView?.(doc)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-6 items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => onDocumentDownload?.(doc)}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                        {!readOnly ? (
                          <button
                            type="button"
                            disabled={!docId || deleting}
                            onClick={() => onDocumentDelete?.(docId)}
                            className={`inline-flex h-6 items-center justify-center gap-1 rounded border px-2 text-[10px] font-semibold ${
                              docId ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deleting ? 'Deleting...' : 'Delete'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                {stagedFiles.map((file, index) => (
                  <div key={`${item.key}-${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1.5">
                    <p className="truncate text-[11px] font-semibold text-indigo-800">{file.name}</p>
                    <button
                      type="button"
                      onClick={() => onPendingDocumentRemove?.(item.key, index)}
                      className="rounded border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RatingGrid({ title, fields, ratings, onToggle }) {
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
                        onChange={() => onToggle(field.key, value)}
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

function AssessmentForm({ title, fields, assessment, onToggle }) {
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
                        onChange={() => onToggle(field.key, value)}
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
                    onChange={() => onToggle('counselingOfCandidate', value)}
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
                      onChange={() => onToggle('counselingMode', value)}
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

function InterviewQuestionsForm({ questions, onQuestionChange, onMarksChange, onAddQuestion }) {
  const result = calculateQuestionMarksResult(questions, { preserveRows: true })

  return (
    <div className="rounded-xl border-2 border-slate-900 bg-white p-4 sm:p-6">
      <div className="text-center">
        <span className="inline-flex bg-slate-950 px-2 py-1 text-base font-bold text-white sm:text-lg">Interview Questions and Answers</span>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onAddQuestion}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {(questions || []).map((row, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[44px_minmax(0,1fr)_140px] md:items-center">
            <div className="text-sm font-bold text-slate-950 sm:text-base">{index + 1}.</div>
            <input
              value={row.question || ''}
              onChange={(event) => onQuestionChange(index, event.target.value)}
              className="h-10 min-w-0 border-0 border-b-2 border-slate-900 bg-transparent px-1 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-0"
              aria-label={`Interview question ${index + 1}`}
            />
            <label className="flex h-10 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900">
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={row.marks || ''}
                onChange={(event) => onMarksChange(index, event.target.value)}
                className="h-8 min-w-0 flex-1 border-0 bg-transparent text-center font-bold outline-none focus:ring-0"
                aria-label={`Question ${index + 1} marks`}
              />
              <span className="shrink-0 text-slate-500">/10</span>
            </label>
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

const interviewChoiceValues = ['Yes', 'No', 'Pending']
const interviewStatusValues = ['Pending', 'Selected', 'Rejected', 'On Hold']
const interviewStatusColors = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Selected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  'On Hold': 'bg-slate-50 text-slate-700 ring-slate-200'
}

function InterviewInput({ label, value, onChange, readOnly = false, type = 'text', className = '', placeholder, min, max, step }) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <input
        type={type}
        value={value || ''}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={`${inputClass} ${readOnly ? 'cursor-default bg-slate-50' : ''}`}
      />
    </label>
  )
}

function InterviewTextarea({ label, value, onChange, readOnly = false, className = '', placeholder }) {
  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <textarea
        rows={3}
        value={value || ''}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={`${textAreaClass} ${readOnly ? 'cursor-default bg-slate-50' : ''}`}
      />
    </label>
  )
}

function InterviewChoice({ label, value, onChange, readOnly = false }) {
  return (
    <div className="text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <div className="mt-1 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-300 bg-white">
        {interviewChoiceValues.map((choice) => {
          const active = value === choice
          return (
            <button
              key={choice}
              type="button"
              disabled={readOnly}
              onClick={() => onChange?.(choice)}
              className={`h-11 text-sm font-semibold transition ${
                active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              } ${readOnly ? 'cursor-default hover:bg-white' : ''}`}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InterviewStatusSelect({ value, onChange, readOnly = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      Selection Status
      <select
        value={value || 'Pending'}
        disabled={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`${inputClass} ${readOnly ? 'cursor-default bg-slate-50' : ''}`}
      >
        {interviewStatusValues.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </label>
  )
}

function InterviewStatusBadge({ status }) {
  const value = status || 'Pending'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${interviewStatusColors[value] || interviewStatusColors.Pending}`}>
      {value}
    </span>
  )
}

function InterviewReferenceSelect({ value, options, onChange, readOnly = false }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      Reference
      <select
        value={value || ''}
        disabled={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`${inputClass} ${readOnly ? 'cursor-default bg-slate-50' : ''}`}
      >
        <option value="">Select Reference</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function InterviewUpdatePanel({
  mode,
  candidateName,
  candidateMobile,
  draft,
  saving,
  referenceOptions,
  pendingFiles = {},
  uploadingDocumentType = '',
  deletingDocumentId = '',
  onChange,
  onClose,
  onSave,
  onDocumentSelect,
  onPendingDocumentRemove,
  onDocumentView,
  onDocumentDownload,
  onDocumentDelete
}) {
  if (!draft || !mode) return null

  const readOnly = mode === 'view'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 sm:p-5" onClick={onClose}>
      <div
        className="max-h-[calc(100dvh-1rem)] w-full max-w-6xl overflow-y-auto rounded-xl border border-indigo-100 bg-white p-4 shadow-2xl sm:max-h-[92vh] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-950">{readOnly ? 'Interview Details' : 'Interview Update'}</h3>
            <p className="mt-1 text-sm text-slate-500">Company-wise interview discussion and follow-up record.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="Close interview panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InterviewInput label="Name Of Candidate" value={draft.candidateName || candidateName} readOnly />
          <InterviewInput label="Mobile Number" value={candidateMobile} readOnly />
          <InterviewInput
            label="Name Of Company"
            value={draft.companyName}
            readOnly={readOnly}
            placeholder="Enter company name"
            onChange={(value) => onChange('companyName', value)}
          />
          <InterviewInput
            label="Job Role/Department"
            value={draft.jobRole}
            readOnly={readOnly}
            placeholder="Enter job role"
            onChange={(value) => onChange('jobRole', value)}
          />
          <InterviewReferenceSelect
            value={draft.referencePerson}
            readOnly={readOnly}
            options={referenceOptions}
            onChange={(value) => onChange('referencePerson', value)}
          />
          <InterviewInput
            label="Date Of Interview"
            type="date"
            value={draft.date}
            readOnly={readOnly}
            onChange={(value) => onChange('date', value)}
          />
          <InterviewChoice label="Attend Interview" value={draft.attendInterview} readOnly={readOnly} onChange={(value) => onChange('attendInterview', value)} />
          <InterviewChoice label="Interested For Join" value={draft.interestedForJoin} readOnly={readOnly} onChange={(value) => onChange('interestedForJoin', value)} />
          <InterviewInput
            label="Selection Chances"
            value={draft.selectionChances}
            readOnly={readOnly}
            placeholder="High / Medium / Low"
            onChange={(value) => onChange('selectionChances', value)}
          />
          <InterviewStatusSelect value={draft.status} readOnly={readOnly} onChange={(value) => onChange('status', value)} />
          <InterviewInput
            label="Rating For Company (/5)"
            type="number"
            min="0"
            max="5"
            step="0.5"
            value={draft.ratingForCompany}
            readOnly={readOnly}
            placeholder="0 to 5"
            onChange={(value) => onChange('ratingForCompany', value)}
          />
          <InterviewTextarea
            label="Not Attend Remark"
            value={draft.notAttendRemark}
            readOnly={readOnly}
            placeholder="Remark if candidate did not attend"
            onChange={(value) => onChange('notAttendRemark', value)}
          />
          <InterviewTextarea
            label="IF Not Interested Reason"
            value={draft.notInterestedReason}
            readOnly={readOnly}
            placeholder="Reason if candidate is not interested"
            onChange={(value) => onChange('notInterestedReason', value)}
          />
          <InterviewTextarea
            label="Reply From Company"
            value={draft.replyFromCompany}
            readOnly={readOnly}
            placeholder="Company response"
            onChange={(value) => onChange('replyFromCompany', value)}
          />
          <InterviewTextarea
            label="Positive Feedback"
            value={draft.positiveFeedback}
            readOnly={readOnly}
            placeholder="Positive feedback"
            onChange={(value) => onChange('positiveFeedback', value)}
          />
          <InterviewTextarea
            label="Negative Feedback"
            value={draft.negativeFeedback}
            readOnly={readOnly}
            placeholder="Negative feedback"
            onChange={(value) => onChange('negativeFeedback', value)}
          />
          <InterviewTextarea
            label="Overall Discussion"
            value={draft.overallDiscussion}
            readOnly={readOnly}
            placeholder="Overall discussion"
            onChange={(value) => onChange('overallDiscussion', value)}
          />
          <InterviewTextarea label="Note" value={draft.note} readOnly={readOnly} placeholder="Additional note" onChange={(value) => onChange('note', value)} />
          <InterviewInput
            label="Update By"
            value={draft.updatedBy}
            readOnly={readOnly}
            placeholder="SJP HR"
            onChange={(value) => onChange('updatedBy', value)}
          />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-slate-900">Company-wise Interview Documents</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {draft.companyName ? `${draft.companyName} interview documents` : 'Upload documents for this company interview after filling company details.'}
            </p>
          </div>
          <InterviewDocumentsPanel
            draft={draft}
            mode={mode}
            saving={saving}
            pendingFiles={pendingFiles}
            uploadingDocumentType={uploadingDocumentType}
            deletingDocumentId={deletingDocumentId}
            onDocumentSelect={onDocumentSelect}
            onPendingDocumentRemove={onPendingDocumentRemove}
            onDocumentView={onDocumentView}
            onDocumentDownload={onDocumentDownload}
            onDocumentDelete={onDocumentDelete}
          />
        </div>

        {!readOnly ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Interview'}
            </button>
          </div>
        ) : null}
        {readOnly ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function AddCandidate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEdit = Boolean(id)

  const [candidate, setCandidate] = useState(() => emptyCandidateForm())
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [savingInterview, setSavingInterview] = useState(false)
  const [errors, setErrors] = useState({})
  const [interviewMode, setInterviewMode] = useState(null)
  const [interviewDraft, setInterviewDraft] = useState(null)
  const [activePanel, setActivePanel] = useState(() => (isEdit ? panelFromSearch(searchParams) : 'details'))
  const [candidateDetailsStep, setCandidateDetailsStep] = useState(0)
  const [uploadingDocumentType, setUploadingDocumentType] = useState('')
  const [deletingDocumentId, setDeletingDocumentId] = useState('')
  const [advisorReferenceOptions, setAdvisorReferenceOptions] = useState(['Walk-in'])
  const [previewDocument, setPreviewDocument] = useState(null)
  const [uploadingInterviewDocumentType, setUploadingInterviewDocumentType] = useState('')
  const [deletingInterviewDocumentId, setDeletingInterviewDocumentId] = useState('')
  const [pendingInterviewFiles, setPendingInterviewFiles] = useState({})
  const [documentInterviewId, setDocumentInterviewId] = useState('')
  const [interviewSearchTerm, setInterviewSearchTerm] = useState('')
  const [deleteDocumentPrompt, setDeleteDocumentPrompt] = useState({ open: false, type: '', docId: '', interviewId: '', label: '' })
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const autoSaveTimerRef = useRef(null)
  const autoSavePayloadRef = useRef('')
  const autoSaveRequestRef = useRef(0)

  useEffect(() => {
    if (isEdit) setActivePanel(panelFromSearch(searchParams))
  }, [isEdit, searchParams])

  useEffect(() => {
    if (!isEdit) return

    const loadCandidate = async () => {
      try {
        const { data } = await api.get(`/cms/candidates/${id}`)
        const mappedCandidate = mapApiToCandidateForm(data)
        autoSavePayloadRef.current = JSON.stringify(mapCandidateFormToApi(mappedCandidate))
        setCandidate(mappedCandidate)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Candidate not found')
        navigate('/admin/cms/candidates')
      } finally {
        setLoading(false)
      }
    }

    loadCandidate()
  }, [id, isEdit, navigate])

  useEffect(() => {
    const loadAdvisorOptions = async () => {
      try {
        const { data } = await api.get('/ba/all')
      const items = Array.isArray(data) ? data : []
        const labels = items
          .map((item) => {
            const name = String(item?.fullName || item?.userId?.name || '').trim()
            const code = String(item?.userId?.advisorCode || '').trim()
            if (!name && !code) return ''
            return code ? `${name || code} (${code})` : name
          })
          .filter(Boolean)
        setAdvisorReferenceOptions(['Walk-in', ...labels])
      } catch (_error) {
        setAdvisorReferenceOptions(['Walk-in'])
      }
    }

    loadAdvisorOptions()
  }, [])

  useEffect(() => {
    const interviewId = searchParams.get('interview')
    if (!isEdit || loading || !interviewId || interviewDraft?.id === interviewId) return

    const match = (candidate.interviews || []).find((row) => String(row.id) === String(interviewId))
    if (match) {
      setInterviewMode('edit')
      setInterviewDraft({
        ...emptyInterviewRow(),
        ...match,
        candidateName: match.candidateName || candidate.fullName
      })
    }
  }, [candidate.fullName, candidate.interviews, interviewDraft?.id, isEdit, loading, searchParams])

  useEffect(() => {
    if (!isEdit || loading || !id) return undefined
    if (!candidate.fullName.trim() || !candidate.mobile.trim()) {
      setAutoSaveStatus('')
      return undefined
    }

    const payload = mapCandidateFormToApi(candidate)
    const payloadKey = JSON.stringify(payload)
    if (payloadKey === autoSavePayloadRef.current) return undefined

    setAutoSaveStatus('pending')
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    const requestId = autoSaveRequestRef.current + 1
    autoSaveRequestRef.current = requestId
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving')
        await api.put(`/cms/candidates/${id}`, payload)
        if (autoSaveRequestRef.current === requestId) {
          autoSavePayloadRef.current = payloadKey
          setAutoSaveStatus('saved')
        }
      } catch (_error) {
        if (autoSaveRequestRef.current === requestId) {
          setAutoSaveStatus('error')
        }
      }
    }, 900)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [candidate, id, isEdit, loading])

  const update = (key, value) => setCandidate((current) => ({ ...current, [key]: value }))

  const updateCandidatePath = (path, value) =>
    setCandidate((current) => {
      const keys = path.split('.')
      const next = { ...current }
      let target = next

      keys.slice(0, -1).forEach((key) => {
        target[key] = { ...(target[key] || {}) }
        target = target[key]
      })
      target[keys[keys.length - 1]] = value

      if (path === 'sameAsCurrentAddress' && value) {
        next.permanentAddressVillage = current.currentAddressVillage
        next.permanentAddressTaluka = current.currentAddressTaluka
        next.permanentAddressDistrict = current.currentAddressDistrict
        next.permanentAddressState = current.currentAddressState
      }

      if (current.sameAsCurrentAddress && path.startsWith('currentAddress')) {
        next[path.replace('currentAddress', 'permanentAddress')] = value
      }

      return next
    })

  const updateMeta = (key, value) =>
    setCandidate((current) => ({
      ...current,
      formMeta: { ...current.formMeta, [key]: value }
    }))

  const updateFamily = (key, value) =>
    setCandidate((current) => ({
      ...current,
      familyDetails: { ...current.familyDetails, [key]: value }
    }))

  const updateInterviewForm = (key, value) =>
    setCandidate((current) => ({
      ...current,
      interviewForm: { ...current.interviewForm, [key]: value }
    }))

  const updateSuccessInfo = (key, value) =>
    setCandidate((current) => ({
      ...current,
      successInfo: { ...(current.successInfo || {}), [key]: value }
    }))

  const toggleRating = (bucket, key, value) =>
    setCandidate((current) => ({
      ...current,
      interviewForm: {
        ...current.interviewForm,
        [bucket]: {
          ...current.interviewForm[bucket],
          [key]: [value]
        }
      }
    }))

  const toggleDirectorAssessment = (key, value) =>
    setCandidate((current) => ({
      ...current,
      interviewForm: {
        ...current.interviewForm,
        directorAssessment: {
          ...(current.interviewForm.directorAssessment || {}),
          [key]: [value],
          ...(key === 'counselingOfCandidate' && value === 'No' ? { counselingMode: [] } : {})
        }
      }
    }))

  const toggleManagerAssessment = (key, value) =>
    setCandidate((current) => ({
      ...current,
      interviewForm: {
        ...current.interviewForm,
        managerAssessment: {
          ...(current.interviewForm.managerAssessment || {}),
          [key]: [value],
          ...(key === 'counselingOfCandidate' && value === 'No' ? { counselingMode: [] } : {})
        }
      }
    }))

  const updateQuestion = (index, question) =>
    setCandidate((current) => {
      const questions = [...(current.interviewForm.questions || [])]
      questions[index] = {
        ...(questions[index] || { choices: [] }),
        question
      }

      return {
        ...current,
        interviewForm: {
          ...current.interviewForm,
          questions
        }
      }
    })

  const updateQuestionMarks = (index, marks) =>
    setCandidate((current) => {
      const questions = [...(current.interviewForm.questions || [])]
      questions[index] = {
        ...(questions[index] || { question: '', choices: [] }),
        marks: normalizeQuestionMarks(marks)
      }

      return {
        ...current,
        interviewForm: {
          ...current.interviewForm,
          questions
        }
      }
    })

  const addQuestion = () =>
    setCandidate((current) => ({
      ...current,
      interviewForm: {
        ...current.interviewForm,
        questions: [...(current.interviewForm.questions || []), emptyQuestionRow()]
      }
    }))

  const visibleInterviews = (candidate.interviews || []).filter(interviewHasContent)
  const normalizedInterviewSearchTerm = normalizeDocumentSearch(interviewSearchTerm)
  const filteredInterviewRows = visibleInterviews
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) => {
      if (!normalizedInterviewSearchTerm) return true
      return normalizeDocumentSearch(
        [
          index + 1,
          row.companyName,
          row.jobRole,
          row.referencePerson,
          row.date,
          row.status,
          row.selectionChances,
          row.ratingForCompany,
          row.baId,
          row.commissionPercent,
          row.note
        ].filter(Boolean).join(' ')
      ).includes(normalizedInterviewSearchTerm)
    })
  const selectedDocumentInterview = visibleInterviews.find((row) => String(row.id) === String(documentInterviewId)) || visibleInterviews[0] || null

  const clearInterviewDocumentState = () => {
    setUploadingInterviewDocumentType('')
    setDeletingInterviewDocumentId('')
    setPendingInterviewFiles({})
  }

  const startAddInterview = () => {
    clearInterviewDocumentState()
    setInterviewMode('edit')
    setInterviewDraft({
      ...emptyInterviewRow(),
      candidateName: candidate.fullName,
      referencePerson: '',
      updatedBy: 'SJP HR'
    })
  }

  const startViewInterview = (row) => {
    clearInterviewDocumentState()
    setInterviewMode('view')
    setInterviewDraft({
      ...emptyInterviewRow(),
      ...row,
      candidateName: row.candidateName || candidate.fullName
    })
  }

  const startUpdateInterview = (row) => {
    clearInterviewDocumentState()
    setInterviewMode('edit')
    setInterviewDraft({
      ...emptyInterviewRow(),
      ...row,
      candidateName: row.candidateName || candidate.fullName
    })
  }

  const closeInterviewPanel = () => {
    setInterviewMode(null)
    setInterviewDraft(null)
    clearInterviewDocumentState()
    if (searchParams.get('interview')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('interview')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const updateInterviewDraft = (key, value) =>
    setInterviewDraft((current) => ({
      ...(current || emptyInterviewRow()),
      [key]: key === 'ratingForCompany' ? String(value).slice(0, 3) : value
    }))

  const upsertInterviewRow = (savedRow) => {
    setCandidate((current) => {
      const existingRows = (current.interviews || []).filter((row) => interviewHasContent(row))
      const exists = existingRows.some((row) => String(row.id) === String(savedRow.id))
      return {
        ...current,
        interviews: exists
          ? existingRows.map((row) => (String(row.id) === String(savedRow.id) ? savedRow : row))
          : [savedRow, ...existingRows]
      }
    })
  }

  const validateInterviewDocumentFiles = (files) => {
    const invalidType = files.find((file) => !allowedInterviewDocumentTypes.has(file.type))
    if (invalidType) {
      toast.error('Interview documents must be JPG, PNG, or PDF')
      return false
    }

    const oversized = files.find((file) => file.size > MAX_DOCUMENT_IMAGE_SIZE)
    if (oversized) {
      toast.error('Each interview document must be 10MB or less')
      return false
    }

    return true
  }

  const uploadInterviewDocumentFiles = async (interviewId, documentType, files) => {
    setUploadingInterviewDocumentType(documentType)
    let latestInterview = null

    try {
      for (const file of files) {
        const payload = new FormData()
        payload.append('documentType', documentType)
        payload.append('document', file)
        // eslint-disable-next-line no-await-in-loop
        const { data } = await api.post(`/cms/interviews/${interviewId}/documents`, payload)
        latestInterview = data?.interview || latestInterview
      }

      if (!latestInterview) return null
      const savedRow = mapInterviewToForm(latestInterview)
      upsertInterviewRow(savedRow)
      setInterviewDraft((current) => (current ? { ...current, ...savedRow } : savedRow))
      return savedRow
    } finally {
      setUploadingInterviewDocumentType('')
    }
  }

  const handleInterviewDocumentSelect = async (documentType, fileList, targetInterviewId = interviewDraft?.id) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    if (!validateInterviewDocumentFiles(files)) return
    if (!isEdit) {
      toast.error('Save candidate first to upload interview documents')
      return
    }

    if (!isMongoId(targetInterviewId)) {
      setPendingInterviewFiles((current) => ({
        ...current,
        [documentType]: [...(current[documentType] || []), ...files]
      }))
      toast.success('Document will upload after saving interview')
      return
    }

    try {
      await uploadInterviewDocumentFiles(targetInterviewId, documentType, files)
      toast.success(files.length > 1 ? `${files.length} documents uploaded` : 'Document uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload interview document')
    }
  }

  const removePendingInterviewDocument = (documentType, index) => {
    setPendingInterviewFiles((current) => ({
      ...current,
      [documentType]: (current[documentType] || []).filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  const requestRemovePendingInterviewDocument = (documentType, index) => {
    setDeleteDocumentPrompt({
      open: true,
      type: 'pendingInterview',
      docId: String(index),
      interviewId: '',
      documentType,
      label: 'this selected image'
    })
  }

  const removeInterviewDocument = async (docId, targetInterviewId = interviewDraft?.id) => {
    if (!isMongoId(targetInterviewId) || !docId) return

    setDeletingInterviewDocumentId(docId)
    try {
      const { data } = await api.delete(`/cms/interviews/${targetInterviewId}/documents/${docId}`)
      const savedRow = mapInterviewToForm(data?.interview)
      upsertInterviewRow(savedRow)
      setInterviewDraft((current) => (current ? { ...current, ...savedRow } : savedRow))
      toast.success('Document deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete interview document')
    } finally {
      setDeletingInterviewDocumentId('')
    }
  }

  const requestRemoveInterviewDocument = (docId, targetInterviewId = interviewDraft?.id) => {
    if (!isMongoId(targetInterviewId) || !docId) return
    setDeleteDocumentPrompt({
      open: true,
      type: 'interview',
      docId,
      interviewId: targetInterviewId,
      label: 'this interview image'
    })
  }

  const viewInterviewDocument = async (doc, targetInterviewId = interviewDraft?.id) => {
    const docId = String(doc?._id || '')
    if (!isMongoId(targetInterviewId) || !docId) return

    try {
      const { data } = await api.get(`/cms/interviews/${targetInterviewId}/documents/${docId}/view`, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(data)
      if (isImageDocLike(doc)) {
        setPreviewDocument({
          url: objectUrl,
          name: doc?.documentLabel || doc?.fileName || 'Interview document'
        })
        return
      }

      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not open interview document')
    }
  }

  const downloadInterviewDocument = async (doc, targetInterviewId = interviewDraft?.id) => {
    const docId = String(doc?._id || '')
    if (!isMongoId(targetInterviewId) || !docId) return

    try {
      const { data } = await api.get(`/cms/interviews/${targetInterviewId}/documents/${docId}/view`, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = doc?.fileName || doc?.documentLabel || 'interview-document'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not download interview document')
    }
  }

  const saveInterviewDraft = async () => {
    if (!interviewDraft?.companyName?.trim()) {
      toast.error('Name of company is required')
      return
    }

    const draft = {
      ...interviewDraft,
      candidateName: interviewDraft.candidateName || candidate.fullName,
      updatedBy: interviewDraft.updatedBy || 'SJP HR'
    }

    try {
      setSavingInterview(true)
      if (!isEdit) {
        const savedRow = {
          ...draft,
          id: draft.id || Date.now() + Math.random()
        }
        upsertInterviewRow(savedRow)
        setInterviewMode('view')
        setInterviewDraft(savedRow)
        toast.success('Interview added to candidate')
        return
      }

      const payload = mapFormInterviewToApi(draft)
      const { data } = isMongoId(draft.id)
        ? await api.put(`/cms/interviews/${draft.id}`, payload)
        : await api.post(`/cms/candidates/${id}/interviews`, payload)
      let savedRow = mapInterviewToForm(data)
      upsertInterviewRow(savedRow)

      const pendingEntries = Object.entries(pendingInterviewFiles).filter(([, files]) => files?.length)
      if (pendingEntries.length) {
        try {
          for (const [documentType, files] of pendingEntries) {
            // eslint-disable-next-line no-await-in-loop
            savedRow = (await uploadInterviewDocumentFiles(savedRow.id, documentType, files)) || savedRow
          }
          setPendingInterviewFiles({})
        } catch (uploadError) {
          toast.error(uploadError.response?.data?.message || 'Interview saved, but documents could not upload')
        }
      }

      setInterviewMode('view')
      setInterviewDraft(savedRow)
      toast.success('Interview saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save interview')
    } finally {
      setSavingInterview(false)
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!candidate.fullName.trim()) nextErrors.fullName = 'Candidate name is required'
    if (!candidate.mobile.trim()) nextErrors.mobile = 'Mobile number is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateCandidateIdentity = () => {
    const nextErrors = {}
    if (!candidate.fullName.trim()) nextErrors.fullName = 'Candidate name is required'
    if (!candidate.mobile.trim()) nextErrors.mobile = 'Mobile number is required'

    if (Object.keys(nextErrors).length) {
      setErrors((current) => ({ ...current, ...nextErrors }))
      setActivePanel('details')
      setCandidateDetailsStep(0)
      toast.error('Please fill candidate name and mobile number first')
      return false
    }

    setErrors((current) => {
      const { fullName, mobile, ...rest } = current
      return rest
    })
    return true
  }

  const changeActivePanel = (panel) => {
    if (panel !== 'details' && !validateCandidateIdentity()) return
    setActivePanel(panel)
  }

  const changeCandidateDetailsStep = (step) => {
    if (step > 0 && !validateCandidateIdentity()) return
    setCandidateDetailsStep(step)
  }

  const save = async () => {
    if (!validate()) {
      toast.error('Please fill required candidate details')
      return
    }

    const incompleteInterview = candidate.interviews.find((row) => interviewHasContent(row) && !String(row.companyName || '').trim())
    if (incompleteInterview) {
      toast.error('Company name is required for interview rows')
      return
    }

    try {
      setSaving(true)
      const payload = mapCandidateFormToApi(candidate)
      let candidateId = id

      if (isEdit) {
        await api.put(`/cms/candidates/${id}`, payload)
      } else {
        const { data } = await api.post('/cms/candidates', payload)
        candidateId = data?._id
      }

      const desiredRows = sanitizeInterviews(candidate.interviews)
      const { data: existingRaw } = await api.get(`/cms/candidates/${candidateId}/interviews`)
      const existingRows = Array.isArray(existingRaw) ? existingRaw : []
      const desiredById = new Map(desiredRows.filter((row) => isMongoId(row.id)).map((row) => [String(row.id), row]))

      await Promise.all(
        existingRows.map((row) => {
          const match = desiredById.get(String(row._id))
          if (!match) return api.delete(`/cms/interviews/${row._id}`)
          return api.put(`/cms/interviews/${row._id}`, mapFormInterviewToApi(match))
        })
      )

      await Promise.all(
        desiredRows
          .filter((row) => !isMongoId(row.id))
          .map((row) => api.post(`/cms/candidates/${candidateId}/interviews`, mapFormInterviewToApi(row)))
      )

      toast.success(isEdit ? 'Candidate updated successfully' : 'Candidate saved successfully')
      navigate('/admin/cms/candidates')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save candidate')
    } finally {
      setSaving(false)
    }
  }

  const uploadDocuments = async (documentType, files) => {
    if (!isEdit || !id) {
      toast.error('Save candidate first to upload documents')
      return
    }
    const fileList = Array.from(files || []).filter(Boolean)
    if (!fileList.length) return
    const documentConfig = allCandidateDocumentTypes.find((item) => item.key === documentType)
    const allowedTypes = new Set(documentConfig?.allowedTypes || Array.from(allowedDocumentImageTypes))

    for (const file of fileList) {
      if (!allowedTypes.has(file.type)) {
        toast.error(`${file.name}: ${documentConfig?.typeMessage || 'only JPG/PNG images are allowed'}`)
        return
      }
      if (file.size <= 0 || file.size > MAX_DOCUMENT_IMAGE_SIZE) {
        toast.error(`${file.name}: file must be 10MB or less`)
        return
      }
    }

    setUploadingDocumentType(documentType)
    try {
      let latestCandidate = null
      for (const file of fileList) {
        const payload = new FormData()
        payload.append('documentType', documentType)
        payload.append('document', file)
        // eslint-disable-next-line no-await-in-loop
        const { data } = await api.post(`/cms/candidates/${id}/documents`, payload)
        latestCandidate = data?.candidate || latestCandidate
      }

      if (latestCandidate) {
        setCandidate((current) => ({
          ...current,
          documents: Array.isArray(latestCandidate.documents) ? latestCandidate.documents : current.documents
        }))
      }
      toast.success(fileList.length > 1 ? `${fileList.length} documents uploaded` : 'Document uploaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload document')
    } finally {
      setUploadingDocumentType('')
    }
  }

  const removeDocument = async (docId) => {
    if (!isEdit || !id || !docId) return

    setDeletingDocumentId(docId)
    try {
      const { data } = await api.delete(`/cms/candidates/${id}/documents/${docId}`)
      setCandidate((current) => ({
        ...current,
        documents: Array.isArray(data?.candidate?.documents) ? data.candidate.documents : current.documents
      }))
      toast.success('Document deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete document')
    } finally {
      setDeletingDocumentId('')
    }
  }

  const viewDocument = async (doc) => {
    const docId = String(doc?._id || '')
    if (!isEdit || !id || !docId) return

    try {
      const { data } = await api.get(`/cms/candidates/${id}/documents/${docId}/view`, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(data)
      if (isImageDocLike(doc)) {
        setPreviewDocument({
          url: objectUrl,
          name: doc?.documentLabel || doc?.fileName || 'Document'
        })
        return
      }

      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not open document')
    }
  }

  const requestRemoveDocument = (docId) => {
    if (!docId) return
    setDeleteDocumentPrompt({
      open: true,
      type: 'candidate',
      docId,
      interviewId: '',
      label: 'this candidate image'
    })
  }

  const confirmRemoveDocument = async () => {
    const prompt = deleteDocumentPrompt
    setDeleteDocumentPrompt({ open: false, type: '', docId: '', interviewId: '', label: '' })

    if (prompt.type === 'candidate') {
      await removeDocument(prompt.docId)
      return
    }

    if (prompt.type === 'interview') {
      await removeInterviewDocument(prompt.docId, prompt.interviewId)
      return
    }

    if (prompt.type === 'pendingInterview') {
      removePendingInterviewDocument(prompt.documentType, Number(prompt.docId))
    }
  }

  const downloadDocument = async (doc) => {
    const docId = String(doc?._id || '')
    if (!isEdit || !id || !docId) return

    try {
      const { data } = await api.get(`/cms/candidates/${id}/documents/${docId}/view`, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = doc?.fileName || doc?.documentLabel || 'candidate-document'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not download document')
    }
  }

  const exportAssessmentPdf = async () => {
    if (!isEdit || !id || activePanel !== 'assessment') return
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id)
    const panelName = safeFileName(panelLabels.assessment)

    try {
      const { data } = await api.get(`/cms/candidates/${id}/success-remark.pdf`, { responseType: 'blob' })
      downloadBlob(data, `${candidateName}-${panelName}.pdf`)
      toast.success('PDF downloaded')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not export PDF')
    }
  }

  const exportCandidateDetailsPdf = () => {
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id || 'candidate')
    downloadBlob(createCandidateDetailsPdf(candidate), `${candidateName}-Candidate-Details.pdf`)
    toast.success('Candidate details PDF downloaded')
  }

  const exportSuccessInfoPdf = () => {
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id || 'candidate')
    downloadBlob(createSuccessInfoPdf(candidate), `${candidateName}-Success-Info.pdf`)
    toast.success('Success info PDF downloaded')
  }

  const exportCompanyInterviewPdf = (row) => {
    const candidateName = safeFileName(candidate.fullName || candidate.candidateCode || id || 'candidate')
    const companyName = safeFileName(row?.companyName || 'company-interview')
    downloadBlob(createCompanyInterviewPdf(candidate, row), `${candidateName}-${companyName}-Interview.pdf`)
    toast.success('Company interview PDF downloaded')
  }

  const copyAssessmentPdfLink = async () => {
    if (!isEdit || !id || activePanel !== 'assessment') return

    try {
      const { data } = await api.post(`/cms/candidates/${id}/success-remark-share`)
      const copied = await copyToClipboard(data?.url)
      toast[copied ? 'success' : 'error'](copied ? 'PDF link copied' : 'Could not copy PDF link')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create PDF link')
    }
  }

  if (loading) return <div className={cardClass}>Loading candidate...</div>

  const documentsByType = latestDocumentsByType(candidate.documents)
  const documentCountsByType = countDocumentsByType(candidate.documents)
  const documentsByTypeList = documentsGroupedByType(candidate.documents)
  const extraDocuments = unmatchedDocuments(candidate.documents)
  const autoSaveStatusText =
    autoSaveStatus === 'pending'
      ? 'Unsaved changes'
      : autoSaveStatus === 'saving'
        ? 'Auto saving...'
        : autoSaveStatus === 'saved'
          ? 'Auto saved'
          : autoSaveStatus === 'error'
            ? 'Auto save failed. Use Save Candidate.'
            : ''
  const autoSaveStatusClass =
    autoSaveStatus === 'error' ? 'text-rose-600' : autoSaveStatus === 'saved' ? 'text-emerald-600' : 'text-slate-500'
  const showCandidateSave = !isEdit || (activePanel !== 'interviews' && activePanel !== 'documents')

  return (
    <div className="space-y-3 sm:space-y-4">
      <button
        type="button"
        onClick={() => navigate('/admin/cms/candidates')}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h1>
          {candidate.candidateCode ? <p className="mt-1 text-sm font-semibold text-slate-500">Candidate ID: {candidate.candidateCode}</p> : null}
          {isEdit && autoSaveStatusText ? <p className={`mt-1 text-xs font-semibold ${autoSaveStatusClass}`}>{autoSaveStatusText}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {activePanel === 'details' ? (
            <button
              type="button"
              onClick={exportCandidateDetailsPdf}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export Details PDF
            </button>
          ) : null}
          {isEdit && activePanel === 'successInfo' ? (
            <button
              type="button"
              onClick={exportSuccessInfoPdf}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export Success PDF
            </button>
          ) : null}
          {isEdit && activePanel === 'assessment' ? (
            <button
              type="button"
              onClick={exportAssessmentPdf}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          ) : null}
          {isEdit && activePanel === 'assessment' ? (
            <button
              type="button"
              onClick={copyAssessmentPdfLink}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              <Copy className="h-4 w-4" />
              Copy PDF Link
            </button>
          ) : null}
          {showCandidateSave ? (
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Candidate'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FormTabButton active={activePanel === 'details'} label="Candidate Details" onClick={() => changeActivePanel('details')} />
        <FormTabButton active={activePanel === 'documents'} label="Documents" onClick={() => changeActivePanel('documents')} />
        <FormTabButton active={activePanel === 'successInfo'} label="Success Info For Candidate" onClick={() => changeActivePanel('successInfo')} />
        <FormTabButton active={activePanel === 'assessment'} label="Success Interviewer Remark" onClick={() => changeActivePanel('assessment')} />
        <FormTabButton active={activePanel === 'interviews'} label="Company Interviews" onClick={() => changeActivePanel('interviews')} />
      </div>

      {activePanel === 'details' ? (
        <CandidateDetailsApplicationPanel
          candidate={candidate}
          errors={errors}
          currentStep={candidateDetailsStep}
          onStep={changeCandidateDetailsStep}
          onPathChange={updateCandidatePath}
        />
      ) : null}

      {activePanel === 'documents' ? (
        <>
          <CandidateDocumentsPanel
            documentsByType={documentsByType}
            documentsByTypeList={documentsByTypeList}
            documentCountsByType={documentCountsByType}
            extraDocuments={extraDocuments}
            uploadingDocumentType={uploadingDocumentType}
            deletingDocumentId={deletingDocumentId}
            uploadDocuments={uploadDocuments}
            viewDocument={viewDocument}
            downloadDocument={downloadDocument}
            removeDocument={requestRemoveDocument}
          />

          <Section title="Company-wise Interview Documents" icon={Upload}>
            {visibleInterviews.length ? (
              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-slate-500">Select Company Interview</p>
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

                {selectedDocumentInterview ? (
                  <InterviewDocumentsPanel
                    draft={selectedDocumentInterview}
                    mode="edit"
                    saving={savingInterview}
                    uploadingDocumentType={uploadingInterviewDocumentType}
                    deletingDocumentId={deletingInterviewDocumentId}
                    onDocumentSelect={(documentType, files) => handleInterviewDocumentSelect(documentType, files, selectedDocumentInterview.id)}
                    onDocumentView={(doc) => viewInterviewDocument(doc, selectedDocumentInterview.id)}
                    onDocumentDownload={(doc) => downloadInterviewDocument(doc, selectedDocumentInterview.id)}
                    onDocumentDelete={(docId) => requestRemoveInterviewDocument(docId, selectedDocumentInterview.id)}
                  />
                ) : null}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">No company interview added yet. Add an interview first, then upload its letters here.</p>
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
                  {field.options ? (
                    <select
                      className={inputClass}
                      value={candidate.successInfo?.[field.key] || ''}
                      onChange={(event) => updateSuccessInfo(field.key, event.target.value)}
                    >
                      {field.options.map((option) => (
                        <option key={option || 'empty'} value={option}>
                          {option || 'Select'}
                        </option>
                      ))}
                    </select>
                  ) : multiline ? (
                    <textarea
                      className={textAreaClass}
                      rows={3}
                      value={candidate.successInfo?.[field.key] || ''}
                      placeholder={field.label}
                      onChange={(event) => updateSuccessInfo(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      value={candidate.successInfo?.[field.key] || ''}
                      placeholder={field.label}
                      onChange={(event) => updateSuccessInfo(field.key, event.target.value)}
                    />
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

          <AssessmentForm title="Director Assessment" fields={DIRECTOR_ASSESSMENT_FIELDS} assessment={candidate.interviewForm.directorAssessment} onToggle={toggleDirectorAssessment} />
          <AssessmentForm title="Manager Assessment" fields={MANAGER_ASSESSMENT_FIELDS} assessment={candidate.interviewForm.managerAssessment} onToggle={toggleManagerAssessment} />

          <div className="grid gap-4 xl:grid-cols-2">
            <RatingGrid
              title="Professional Assessment"
              fields={PROFESSIONAL_RATING_FIELDS}
              ratings={candidate.interviewForm.professionalRatings}
              onToggle={(key, value) => toggleRating('professionalRatings', key, value)}
            />
            <RatingGrid
              title="Personality Assessment"
              fields={PERSONALITY_RATING_FIELDS}
              ratings={candidate.interviewForm.personalityRatings}
              onToggle={(key, value) => toggleRating('personalityRatings', key, value)}
            />
          </div>

          <FieldGroup title="Success Interviewer Remark">
            <Field label="Suitable Industry">
              <input className={inputClass} value={candidate.interviewForm.suitableIndustry} onChange={(event) => updateInterviewForm('suitableIndustry', event.target.value)} />
            </Field>
            <Field label="Suitable Department">
              <input className={inputClass} value={candidate.interviewForm.suitableDepartment} onChange={(event) => updateInterviewForm('suitableDepartment', event.target.value)} />
            </Field>
            <Field label="HR Interviewer">
              <input className={inputClass} value={candidate.interviewForm.hrInterviewer} onChange={(event) => updateInterviewForm('hrInterviewer', event.target.value)} />
            </Field>
            <Field label="Remark">
              <input className={inputClass} value={candidate.interviewForm.remark} onChange={(event) => updateInterviewForm('remark', event.target.value)} />
            </Field>
          </FieldGroup>

          <InterviewQuestionsForm
            questions={candidate.interviewForm.questions}
            onQuestionChange={updateQuestion}
            onMarksChange={updateQuestionMarks}
            onAddQuestion={addQuestion}
          />
        </Section>
      ) : null}

      {activePanel === 'interviews' ? (
        <Section title="Company Interviews">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">Company-wise interview updates are shown here. Use View or Update for full details.</p>
            <button
              type="button"
              onClick={startAddInterview}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Interview
            </button>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={interviewSearchTerm}
              onChange={(event) => setInterviewSearchTerm(event.target.value)}
              placeholder="Search by company name or interview number"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-14 px-4 py-3">#</th>
                    <th className="px-4 py-3">Company Name</th>
                    <th className="w-40 px-4 py-3">Job Role/Department</th>
                    <th className="w-36 px-4 py-3">Interview Date</th>
                    <th className="w-36 px-4 py-3">Selection Status</th>
                    <th className="w-72 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInterviewRows.map(({ row, index }) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="truncate px-4 py-3 font-semibold text-slate-900">{row.companyName || '-'}</td>
                      <td className="truncate px-4 py-3 text-slate-700">{row.jobRole || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{row.date || '-'}</td>
                      <td className="px-4 py-3">
                        <InterviewStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => exportCompanyInterviewPdf(row)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            <Download className="h-4 w-4" />
                            Export PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => startViewInterview(row)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => startUpdateInterview(row)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            <Pencil className="h-4 w-4" />
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInterviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        {visibleInterviews.length ? 'No interviews matched your search.' : 'No interview updates added yet.'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <InterviewUpdatePanel
            mode={interviewMode}
            candidateName={candidate.fullName}
            candidateMobile={candidate.mobile}
            draft={interviewDraft}
            saving={savingInterview}
            referenceOptions={advisorReferenceOptions}
            pendingFiles={pendingInterviewFiles}
            uploadingDocumentType={uploadingInterviewDocumentType}
            deletingDocumentId={deletingInterviewDocumentId}
            onChange={updateInterviewDraft}
            onClose={closeInterviewPanel}
            onSave={saveInterviewDraft}
            onDocumentSelect={handleInterviewDocumentSelect}
            onPendingDocumentRemove={requestRemovePendingInterviewDocument}
            onDocumentView={viewInterviewDocument}
            onDocumentDownload={downloadInterviewDocument}
            onDocumentDelete={requestRemoveInterviewDocument}
          />
        </Section>
      ) : null}

      <div className="flex flex-col justify-end gap-2 sm:flex-row">
        {showCandidateSave ? (
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Candidate'}
          </button>
        ) : null}
      </div>

      {previewDocument ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" onClick={() => {
          URL.revokeObjectURL(previewDocument.url)
          setPreviewDocument(null)
        }}>
          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="truncate text-sm font-bold text-slate-900">{previewDocument.name}</p>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewDocument.url)
                  setPreviewDocument(null)
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-slate-100 p-3">
              <img src={previewDocument.url} alt={previewDocument.name} className="mx-auto h-auto max-h-[75vh] w-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteDocumentPrompt.open}
        title="Delete Image"
        message={`Are you sure you want to delete ${deleteDocumentPrompt.label || 'this image'}?`}
        confirmText="Yes, delete"
        cancelText="No"
        danger
        onCancel={() => setDeleteDocumentPrompt({ open: false, type: '', docId: '', interviewId: '', label: '' })}
        onConfirm={confirmRemoveDocument}
      />
    </div>
  )
}
