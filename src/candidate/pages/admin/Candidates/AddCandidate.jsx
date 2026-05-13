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
  Trash2,
  Upload,
  UserRound,
  Users,
  X
} from 'lucide-react'
import api from '../../../api/axios'
import { ConfirmDialog } from '../../../components/ActionDialogs'
import { allowedDocumentImageTypes, candidateDocumentTypes, MAX_DOCUMENT_IMAGE_SIZE } from '../../../constants/candidateDocuments'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import {
  PERSONALITY_RATING_FIELDS,
  PROFESSIONAL_RATING_FIELDS,
  QUESTION_CHOICES,
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

const documentTypeByLabel = candidateDocumentTypes.reduce((acc, item) => {
  acc[item.label.toLowerCase()] = item.key
  return acc
}, {})

const documentTypeAliases = {
  aadhaarcard: 'aadharCard',
  aadharcard: 'aadharCard',
  pancard: 'panCard',
  updatedresume: 'updatedResume',
  educationcertificates: 'educationCertificates',
  alleducationcertificates: 'educationCertificates',
  experienceletter: 'experienceLetter',
  salaryslip: 'salarySlip',
  bankstatement: 'salarySlip',
  passportsizephoto: 'passportSizePhoto',
  medicalfitnesscertificate: 'medicalFitnessCertificate',
  medicalfitnesscertificates: 'medicalFitnessCertificate',
  computercoursecertificate: 'computerCourseCertificate',
  computercoursescertificate: 'computerCourseCertificate',
  hp: 'hamiPatra',
  hamipatra: 'hamiPatra',
  cl: 'concernLetter',
  concernletter: 'concernLetter',
  selectedvideo: 'selectedVideoFeedbackVideo',
  feedbackvideo: 'selectedVideoFeedbackVideo',
  selectedvideofeedbackvideo: 'selectedVideoFeedbackVideo',
  candidatephoto: 'candidatePhoto',
  photoofcandidates: 'candidatePhoto',
  formalphoto: 'candidatePhoto'
}

const normalizeDocToken = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const resolveDocumentType = (doc = {}) => {
  if (doc.documentType) return String(doc.documentType)

  const labelKey = String(doc.documentLabel || '').trim().toLowerCase()
  if (documentTypeByLabel[labelKey]) return documentTypeByLabel[labelKey]

  const normalizedLabel = normalizeDocToken(doc.documentLabel)
  if (documentTypeAliases[normalizedLabel]) return documentTypeAliases[normalizedLabel]

  const normalizedName = normalizeDocToken(doc.fileName)
  if (normalizedName.includes('resume')) return 'updatedResume'
  if (normalizedName.includes('aadhaar') || normalizedName.includes('aadhar')) return 'aadharCard'
  if (normalizedName.includes('pan')) return 'panCard'
  if (normalizedName.includes('passport') || normalizedName.includes('photo')) return 'passportSizePhoto'
  if (normalizedName.includes('salary') || normalizedName.includes('bankstatement')) return 'salarySlip'
  if (normalizedName.includes('experience')) return 'experienceLetter'
  if (normalizedName.includes('hami') || normalizedName.includes('patra')) return 'hamiPatra'
  if (normalizedName.includes('concern')) return 'concernLetter'
  if (normalizedName.includes('feedback') || normalizedName.includes('video')) return 'selectedVideoFeedbackVideo'
  if (normalizedName.includes('candidatephoto') || normalizedName.includes('formalphoto')) return 'candidatePhoto'
  if (normalizedName.includes('education') || normalizedName.includes('certificate')) return 'educationCertificates'

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
    const questionRowStartOffset = 98
    const questionRowHeight = 25
    const questionBottomPadding = 16
    const questionHeight = questionRowStartOffset + rows.length * questionRowHeight + questionBottomPadding
    ensureSpace(questionHeight + 66)
    drawRect(margin, y, pageWidth - margin * 2, questionHeight, { stroke: [0.06, 0.09, 0.16], lineWidth: 1.4 })
    drawText('Candidate Name -', margin + 18, y + 24, { size: 12, bold: true, maxWidth: 115 })
    drawText(candidate.fullName, margin + 145, y + 24, { size: 10.5, bold: true, maxWidth: pageWidth - margin * 2 - 170 })
    drawLine(margin + 145, y + 42, pageWidth - margin - 18, y + 42, [0.06, 0.09, 0.16], 1)
    const titleW = 160
    drawRect((pageWidth - titleW) / 2, y + 62, titleW, 22, { stroke: [0.06, 0.09, 0.16], fill: [0.06, 0.09, 0.16] })
    drawText('Interview Questions', (pageWidth - titleW) / 2 + 8, y + 66, { size: 12, bold: true, fill: [1, 1, 1], maxWidth: titleW - 16 })
    let rowY = y + questionRowStartOffset
    rows.forEach((row, index) => {
      drawText(`${index + 1}.`, margin + 18, rowY + 5, { size: 10, bold: true, maxWidth: 26 })
      drawText(row.question, margin + 52, rowY + 5, { size: 9, bold: true, maxWidth: pageWidth - margin * 2 - 210 })
      drawLine(margin + 52, rowY + 21, pageWidth - margin - 150, rowY + 21, [0.06, 0.09, 0.16], 0.8)
      const choiceX = pageWidth - margin - 138
      QUESTION_CHOICES.forEach((choice, choiceIndex) => {
        const x = choiceX + choiceIndex * 46
        drawRect(x, rowY, 46, 22, { stroke: [0.06, 0.09, 0.16] })
        drawCheckbox(x + 10, rowY + 6, isSelected(row.choices, choice))
        drawText(choice, x + 25, rowY + 5, { size: 9, bold: true, maxWidth: 15 })
      })
      rowY += questionRowHeight
    })
    y += questionHeight + 18

    const columns = result.rows.length + 2
    const tableW = pageWidth - margin * 2
    const cellW = tableW / columns
    const tableY = y
    drawRect(margin, tableY, tableW, 48, { stroke: [0.06, 0.09, 0.16], lineWidth: 1 })
    drawLine(margin, tableY + 24, margin + tableW, tableY + 24)
    Array.from({ length: columns + 1 }, (_, index) => margin + index * cellW).forEach((x) => drawLine(x, tableY, x, tableY + 48))
    drawText('IQ', margin + 10, tableY + 7, { size: 10.5, bold: true, maxWidth: cellW - 20 })
    result.rows.forEach((_row, index) => drawText(index + 1, margin + (index + 1) * cellW + cellW / 2 - 4, tableY + 7, { size: 10.5, bold: true, maxWidth: cellW - 8 }))
    drawText('TQ', margin + (columns - 1) * cellW + 10, tableY + 7, { size: 10.5, bold: true, maxWidth: cellW - 20 })
    drawText('Marks', margin + 8, tableY + 31, { size: 10.5, bold: true, maxWidth: cellW - 16 })
    result.rows.forEach((row, index) => drawText(row.marks, margin + (index + 1) * cellW + cellW / 2 - 6, tableY + 31, { size: 9.5, bold: true, maxWidth: cellW - 8 }))
    drawText(`${result.total}/${result.maxTotal}`, margin + (columns - 1) * cellW + 8, tableY + 31, { size: 9.5, bold: true, maxWidth: cellW - 16 })
    y += 64
  }

  drawText('Success Interviewer Remark', margin, y, { size: 16, bold: true, maxWidth: 360 })
  y += 29
  drawLine(margin, y, pageWidth - margin, y, [0.89, 0.92, 0.96], 0.8)
  y += 22
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

const candidateDetailPanels = [
  {
    title: 'Personal Details',
    icon: UserRound,
    fields: [
      { path: 'fullName', label: 'Candidate Name', required: true, errorKey: 'fullName' },
      { path: 'mobile', label: 'Mobile Number', required: true, inputMode: 'numeric', maxLength: 10, digitsOnly: true, errorKey: 'mobile' },
      { path: 'whatsappNo', label: 'WhatsApp Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'email', label: 'Email ID', type: 'email' },
      { path: 'gender', label: 'Gender', options: ['', 'Male', 'Female', 'Other'] },
      { path: 'currentAge', label: 'Current Age', type: 'number' },
      { path: 'aadhaarNo', label: 'Aadhar Card Number', inputMode: 'numeric', maxLength: 12, digitsOnly: true },
      { path: 'panNo', label: 'PAN Number', maxLength: 10, uppercase: true },
      { path: 'marriageStatus', label: 'Marital Status', options: ['', 'Married', 'Unmarried', 'Single'] },
      { path: 'currentAddress', label: 'Current Address', kind: 'area' },
      { path: 'permanentAddress', label: 'Permanent Address', kind: 'area' }
    ]
  },
  {
    title: 'Education Details',
    icon: GraduationCap,
    fields: [
      { path: 'collegeName', label: 'Institute / College Name' },
      { path: 'education', label: 'Qualification in Details', kind: 'area' },
      { path: 'yearOfHigherEducation', label: 'Year of Higher Education' },
      { path: 'computerCourses', label: 'Computer Courses', kind: 'area' },
      { path: 'otherAchievements', label: 'Other Achievements', kind: 'area' }
    ]
  },
  {
    title: 'Placement / Reference Details',
    icon: Handshake,
    fields: [
      { path: 'advisorCode', label: 'Business Advisor Code' },
      { path: 'placementReference.professorName', label: 'Professor / Staff / TPO Name' },
      { path: 'placementReference.professorContactNumber', label: 'Professor / Staff / TPO Contact Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'placementReference.referenceBy', label: 'Reference By' },
      { path: 'placementReference.referenceContactNumber', label: 'Reference Contact Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true }
    ]
  },
  {
    title: 'Job Preferences',
    icon: ClipboardList,
    fields: [
      { path: 'appliedFor', label: 'Applied For' },
      { path: 'interestedDepartment', label: 'Interested Department' },
      { path: 'lookingForField', label: 'Looking For Jobs In Which Field?' },
      { path: 'preferredIndustry', label: 'Preferred Industry' },
      { path: 'preferredJobLocation', label: 'Preferred Job Location' },
      { path: 'currentJobLocation', label: 'Current Job Location' },
      { path: 'availabilityForInterview', label: 'Availability For Interview' }
    ]
  },
  {
    title: 'Professional Details',
    icon: BriefcaseBusiness,
    fields: [
      { path: 'totalExperience', label: 'Total Years of Experience', type: 'number' },
      { path: 'experienceDepartment', label: 'Current / Last Job Profile / Department' },
      { path: 'currentCompany', label: 'Current / Last Company Name' },
      { path: 'keyResponsibilities', label: 'Key Responsibilities In Previous Job', kind: 'area' },
      { path: 'currentSalary', label: 'Current CTC / Salary' },
      { path: 'expectedSalary', label: 'Expected Salary' },
      { path: 'noticePeriod', label: 'Notice Period' },
      { path: 'careerSummary', label: 'Career Summary', kind: 'area' },
      { path: 'reasonForJobChange', label: 'Reason For Job Change', kind: 'area' }
    ]
  },
  {
    title: 'Family Details',
    icon: Users,
    fields: [
      { path: 'familyDetails.fatherOrHusbandName', label: 'Father / Husband Name' },
      { path: 'familyDetails.fatherOccupation', label: 'Father Occupation' },
      { path: 'familyDetails.fatherMobileNumber', label: 'Father Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'familyDetails.motherOrWifeName', label: 'Mother / Wife Name' },
      { path: 'familyDetails.motherOccupation', label: 'Mother Occupation' },
      { path: 'familyDetails.motherMobileNumber', label: 'Mother Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
      { path: 'familyDetails.siblingName', label: 'Sibling Name' },
      { path: 'familyDetails.siblingEducationOccupation', label: 'Sibling Education / Occupation', kind: 'area' }
    ]
  },
  {
    title: 'Additional Information',
    icon: MessageSquare,
    fields: [
      { path: 'goalAim', label: 'Goal / Aim', kind: 'area' },
      { path: 'feedback', label: 'Feedback', kind: 'area' },
      { path: 'suggestion', label: 'Any Suggestion', kind: 'area' },
      { path: 'formMeta.day', label: 'Day' },
      { path: 'formMeta.receiptNo', label: 'Receipt No' },
      { path: 'formMeta.rcWrc', label: 'RC / WRC' },
      { path: 'formMeta.date', label: 'Receipt Date', type: 'date' }
    ]
  }
]

const getCandidatePathValue = (candidate, path) => {
  const [key, childKey] = path.split('.')
  if (!childKey) return candidate?.[key] ?? ''
  return candidate?.[key]?.[childKey] ?? ''
}

const normalizeApplicationFieldValue = (field, value) => {
  let next = String(value ?? '')
  if (field.digitsOnly) next = next.replace(/\D/g, '')
  if (field.uppercase) next = next.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (field.maxLength) next = next.slice(0, field.maxLength)
  return next
}

function CandidateApplicationField({ field, candidate, errors, onPathChange }) {
  const value = getCandidatePathValue(candidate, field.path)
  const className = field.kind === 'area' ? 'md:col-span-2' : ''
  const error = field.errorKey ? errors[field.errorKey] : ''

  return (
    <Field label={field.label} required={field.required} error={error} className={className}>
      {field.options ? (
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
          <div className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-2">
            {panel.fields.map((field) => (
              <CandidateApplicationField
                key={field.path}
                field={field}
                candidate={candidate}
                errors={errors}
                onPathChange={onPathChange}
              />
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
  return (
          <Section title="Candidate Documents" icon={Upload}>
      <p className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">JPG/PNG images, PDF letters, and MP4/MOV/WebM videos where applicable. Max 10MB each.</p>
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {candidateDocumentTypes.map((item) => {
          const uploadedDoc = documentsByType[item.key]
          const uploadedDocs = documentsByTypeList[item.key] || []
          const uploading = uploadingDocumentType === item.key
          const inputId = `document-upload-${item.key}`
          const uploadedCount = documentCountsByType[item.key] || 0
          const allowMultiple = item.key === 'educationCertificates'

          return (
            <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-5 text-slate-900">{item.label}</p>
                  {item.description ? <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">{item.description}</p> : null}
                  <p className={`mt-0.5 text-xs font-semibold ${uploadedDoc ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {uploadedDoc ? 'Provided' : 'Not provided'}
                  </p>
                  {uploadedDoc?.fileName ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{uploadedDoc.fileName}</p> : null}
                  {uploadedCount > 1 ? <p className="mt-0.5 text-[11px] font-semibold text-indigo-600">{uploadedCount} files uploaded</p> : null}
                </div>
                <label
                  htmlFor={inputId}
                  className={`inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-300 px-2.5 text-xs font-bold ${
                    uploading ? 'text-slate-400' : 'text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </label>
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

              {uploadedDocs.length ? (
                <div className="mt-2 space-y-1.5">
                  {uploadedDocs.map((doc) => {
                    const docId = String(doc?._id || '')
                    const isDeletingDoc = deletingDocumentId && deletingDocumentId === docId
                    return (
                      <div key={docId || doc.fileUrl} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                        <p className="truncate text-[11px] font-semibold text-slate-700">{doc.fileName || doc.documentLabel || 'Uploaded file'}</p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="inline-flex h-6 items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => viewDocument(doc)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </button>
                          <button
                            type="button"
                            disabled={!docId}
                            onClick={() => downloadDocument(doc)}
                            className={`inline-flex h-6 items-center justify-center gap-1 rounded border px-2 text-[10px] font-semibold ${
                              docId ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                          <button
                            type="button"
                            disabled={!docId || isDeletingDoc}
                            onClick={() => removeDocument(docId)}
                            className={`inline-flex h-6 items-center justify-center gap-1 rounded border px-2 text-[10px] font-semibold ${
                              docId ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Trash2 className="h-3 w-3" />
                            {isDeletingDoc ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {extraDocuments.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-500">Other Uploaded Documents</p>
          <div className="grid gap-2 md:grid-cols-2">
            {extraDocuments.map((doc, index) => {
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

function QuestionMarksResultTable({ questions, onMarksChange }) {
  const result = calculateQuestionMarksResult(questions, { preserveRows: true })

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-900 bg-white">
      <table className="min-w-[1200px] border-collapse text-center text-sm text-slate-950">
        <tbody>
          <tr>
            <th className="w-28 border border-slate-900 px-3 py-3 text-lg font-bold">IQ</th>
            {result.scores.map((_score, index) => (
              <th key={index} className="w-16 border border-slate-900 px-3 py-3 text-lg font-bold">
                {index + 1}
              </th>
            ))}
            <th className="w-28 border border-slate-900 px-3 py-3 text-lg font-bold">TQ</th>
          </tr>
          <tr>
            <th className="border border-slate-900 px-3 py-3 text-lg font-bold">Marks</th>
            {result.rows.map((row, index) => (
              <td key={index} className="h-12 border border-slate-900 p-0 font-semibold">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={row.marks || ''}
                  onChange={(event) => onMarksChange(index, event.target.value)}
                  className="h-12 w-full border-0 bg-transparent text-center text-sm font-semibold text-slate-950 outline-none focus:bg-indigo-50 focus:ring-0"
                  aria-label={`Question ${index + 1} marks`}
                />
              </td>
            ))}
            <td className="relative h-12 border border-slate-900 px-3 py-3 align-bottom font-bold">
              <span className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_49%,#0f172a_50%,transparent_51%)]" />
              <span className="relative z-10">
                {result.total}/{result.maxTotal}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function InterviewQuestionsForm({ candidateName, questions, onQuestionChange, onChoiceToggle, onAddQuestion }) {
  return (
    <div className="rounded-xl border-2 border-slate-900 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <p className="shrink-0 text-base font-bold text-slate-950 sm:text-lg">Candidate Name -</p>
        <div className="min-h-9 flex-1 border-b-2 border-slate-900 px-2 py-1 text-sm font-semibold text-slate-900 sm:text-base">
          {candidateName || ''}
        </div>
      </div>

      <div className="mt-7 text-center">
        <span className="inline-flex bg-slate-950 px-2 py-1 text-base font-bold text-white sm:text-lg">Interview Questions</span>
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
          <div key={index} className="grid gap-2 md:grid-cols-[44px_minmax(0,1fr)_180px] md:items-center">
            <div className="text-sm font-bold text-slate-950 sm:text-base">{index + 1}.</div>
            <input
              value={row.question || ''}
              onChange={(event) => onQuestionChange(index, event.target.value)}
              className="h-10 min-w-0 border-0 border-b-2 border-slate-900 bg-transparent px-1 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-0"
              aria-label={`Interview question ${index + 1}`}
            />
            <div className="grid grid-cols-3 overflow-hidden border border-slate-900">
              {QUESTION_CHOICES.map((choice) => {
                const checked = (row.choices || []).includes(choice)
                return (
                  <label
                    key={choice}
                    className={`flex h-9 cursor-pointer items-center justify-center gap-2 border-r border-slate-900 text-sm font-bold last:border-r-0 ${
                      checked ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-950'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-choice-${index}`}
                      checked={checked}
                      onChange={() => onChoiceToggle(index, choice)}
                      className="h-4 w-4 border-slate-400 text-indigo-600"
                      aria-label={`Question ${index + 1} option ${choice}`}
                    />
                    {choice}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
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
  draft,
  saving,
  referenceOptions,
  onChange,
  onClose,
  onSave
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
          <InterviewInput
            label="Name Of Company"
            value={draft.companyName}
            readOnly={readOnly}
            placeholder="Enter company name"
            onChange={(value) => onChange('companyName', value)}
          />
          <InterviewInput
            label="Job Role"
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
          <InterviewInput
            label="Update By"
            value={draft.updatedBy}
            readOnly={readOnly}
            placeholder="SJP HR"
            onChange={(value) => onChange('updatedBy', value)}
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
  const [deleteDocumentPrompt, setDeleteDocumentPrompt] = useState({ open: false, type: '', docId: '', interviewId: '', label: '' })
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const autoSaveTimerRef = useRef(null)
  const autoSavePayloadRef = useRef('')
  const autoSaveRequestRef = useRef(0)

  useEffect(() => {
    setActivePanel(isEdit ? panelFromSearch(searchParams) : 'details')
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
      const [key, childKey] = path.split('.')
      if (!childKey) return { ...current, [key]: value }
      return {
        ...current,
        [key]: {
          ...(current[key] || {}),
          [childKey]: value
        }
      }
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

  const toggleQuestionChoice = (index, choice) =>
    setCandidate((current) => {
      const questions = [...(current.interviewForm.questions || [])]
      const row = questions[index] || { question: '', choices: [] }
      questions[index] = {
        ...row,
        choices: [choice]
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
    if (!isEdit || !id) return
    const fileList = Array.from(files || []).filter(Boolean)
    if (!fileList.length) return
    const documentConfig = candidateDocumentTypes.find((item) => item.key === documentType)
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/cms/candidates')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h1>
          {candidate.candidateCode ? <p className="mt-1 text-sm font-semibold text-slate-500">Candidate ID: {candidate.candidateCode}</p> : null}
          {isEdit && autoSaveStatusText ? <p className={`mt-1 text-xs font-semibold ${autoSaveStatusClass}`}>{autoSaveStatusText}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
          {activePanel !== 'interviews' && activePanel !== 'documents' ? (
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

      {isEdit ? (
        <div className="flex flex-wrap gap-2">
          <FormTabButton active={activePanel === 'details'} label="Candidate Details" onClick={() => setActivePanel('details')} />
          <FormTabButton active={activePanel === 'documents'} label="Documents" onClick={() => setActivePanel('documents')} />
          <FormTabButton active={activePanel === 'successInfo'} label="Success Info For Candidate" onClick={() => setActivePanel('successInfo')} />
          <FormTabButton active={activePanel === 'assessment'} label="Success Interviewer Remark" onClick={() => setActivePanel('assessment')} />
          <FormTabButton active={activePanel === 'interviews'} label="Company Interviews" onClick={() => setActivePanel('interviews')} />
        </div>
      ) : null}

      {!isEdit || activePanel === 'details' ? (
        <CandidateDetailsApplicationPanel
          candidate={candidate}
          errors={errors}
          currentStep={candidateDetailsStep}
          onStep={setCandidateDetailsStep}
          onPathChange={updateCandidatePath}
        />
      ) : null}

      {isEdit && activePanel === 'documents' ? (
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
                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{row.jobRole || row.date || 'No job role added'}</p>
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

      {isEdit && activePanel === 'successInfo' ? (
        <Section title="Success Info For Candidate" icon={ClipboardList}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SUCCESS_INFO_FIELDS.map((field) => {
              const multiline = ['candidateDataSource', 'hrContactDetails', 'interviewAttainedList'].includes(field.key)

              return (
                <Field key={field.key} label={field.label} className={multiline ? 'xl:col-span-3' : ''}>
                  {multiline ? (
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

      {isEdit && activePanel === 'assessment' ? (
        <Section title="Success Interviewer Remark">
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
            candidateName={candidate.fullName}
            questions={candidate.interviewForm.questions}
            onQuestionChange={updateQuestion}
            onChoiceToggle={toggleQuestionChoice}
            onAddQuestion={addQuestion}
          />
          <QuestionMarksResultTable questions={candidate.interviewForm.questions} onMarksChange={updateQuestionMarks} />
        </Section>
      ) : null}

      {isEdit && activePanel === 'interviews' ? (
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

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-14 px-4 py-3">#</th>
                    <th className="px-4 py-3">Company Name</th>
                    <th className="w-40 px-4 py-3">Job Role</th>
                    <th className="w-36 px-4 py-3">Reference</th>
                    <th className="w-36 px-4 py-3">Interview Date</th>
                    <th className="w-36 px-4 py-3">Selection Status</th>
                    <th className="w-44 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleInterviews.map((row, index) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="truncate px-4 py-3 font-semibold text-slate-900">{row.companyName || '-'}</td>
                      <td className="truncate px-4 py-3 text-slate-700">{row.jobRole || '-'}</td>
                      <td className="truncate px-4 py-3 text-slate-700">{row.referencePerson || 'Walk-in'}</td>
                      <td className="px-4 py-3 text-slate-700">{row.date || '-'}</td>
                      <td className="px-4 py-3">
                        <InterviewStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
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
                  {visibleInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No interview updates added yet.
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
            draft={interviewDraft}
            saving={savingInterview}
            referenceOptions={advisorReferenceOptions}
            onChange={updateInterviewDraft}
            onClose={closeInterviewPanel}
            onSave={saveInterviewDraft}
          />
        </Section>
      ) : null}

      <div className="flex flex-col justify-end gap-2 sm:flex-row">
        {activePanel !== 'interviews' && activePanel !== 'documents' ? (
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
