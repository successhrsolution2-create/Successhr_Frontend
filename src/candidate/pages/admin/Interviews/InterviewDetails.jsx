import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, Pencil, X } from 'lucide-react'
import api from '../../../api/axios'
import Pagination from '../../../components/Pagination'

const cardClass = 'bg-white rounded-xl shadow-sm border border-gray-100'

const rowReference = (row) => row?.referencePerson || row?.reference || ''
const rowDate = (row) => row?.date || (row?.interviewDate ? String(row.interviewDate).slice(0, 10) : '')
const rowStatus = (row) => row?.status || row?.result || 'Pending'
const rowSelectionChances = (row) => row?.selectionChances || ''

const visibleInterviews = (rows) =>
  (Array.isArray(rows) ? rows : []).filter((row) => {
    const hasContent = Boolean(
      String(row?.companyName || '').trim() ||
        String(row?.jobRole || '').trim() ||
        String(rowReference(row)).trim() ||
        String(rowSelectionChances(row)).trim() ||
        String(row?.remark || '').trim() ||
        String(rowDate(row)).trim()
    )
    const status = rowStatus(row)
    return hasContent || status !== 'Pending'
  })

const selectionChanceBadge = (value) => {
  if (value === 'Selected' || value === 'High') return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
  if (value === 'Rejected' || value === 'Low') return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
  if (value === 'Medium') return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

const interviewDetailFields = [
  ['companyName', 'Company Name'],
  ['jobRole', 'Job Role/Department'],
  ['referencePerson', 'Reference Person'],
  ['remark', 'Remark'],
  ['date', 'Date'],
  ['attendInterview', 'Attend Interview'],
  ['selectionChances', 'Selection Chances'],
  ['ratingForCompany', 'Rating For Company'],
  ['questionsAsked', 'Questions Asked'],
  ['answerGivenByCandidate', 'Answer Given By Candidate'],
  ['replyFromCompany', 'Reply From Company'],
  ['positiveFeedback', 'Positive Feedback'],
  ['negativeFeedback', 'Negative Feedback'],
  ['overallDiscussion', 'Overall Discussion'],
  ['note', 'Note'],
  ['updatedBy', 'Update By']
]

function BackToInterviewsButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
      aria-label="Back to interviews"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Interviews
    </button>
  )
}

function InterviewDetailsPanel({ row, onClose }) {
  if (!row) return null

  const fieldValue = (key) => {
    if (key === 'referencePerson') return rowReference(row)
    if (key === 'date') return rowDate(row)
    if (key === 'selectionChances') return rowSelectionChances(row)
    if (key === 'ratingForCompany' && row[key] !== '' && row[key] !== undefined && row[key] !== null) return `${row[key]}/5`
    return row[key]
  }

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
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
          const value = fieldValue(key)
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

export default function InterviewDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedInterview, setSelectedInterview] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [{ data: candidateData }, { data: interviewData }] = await Promise.all([
          api.get(`/cms/candidates/${id}`),
          api.get(`/cms/candidates/${id}/interviews`)
        ])

        setCandidate({
          ...candidateData,
          interviews: Array.isArray(interviewData) ? interviewData : []
        })
      } catch (error) {
        setCandidate(null)
        toast.error(error.response?.data?.message || 'Could not load candidate interviews')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const interviews = useMemo(() => visibleInterviews(candidate?.interviews), [candidate])

  useEffect(() => {
    setPage(1)
  }, [candidate?._id, pageSize])

  const paginatedInterviews = useMemo(() => {
    const start = (page - 1) * pageSize
    return interviews.slice(start, start + pageSize)
  }, [interviews, page, pageSize])

  if (loading) {
    return <p className="text-sm text-slate-500">Loading interviews...</p>
  }

  if (!candidate) {
    return (
      <div className="space-y-4">
        <BackToInterviewsButton onClick={() => navigate('/admin/cms/interviews')} />
        <p className="text-sm text-rose-600">Candidate not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div>
          <BackToInterviewsButton onClick={() => navigate('/admin/cms/interviews')} />
          <h1 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{candidate.fullName}</h1>
        </div>
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Job Role/Department</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Selection Chances</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInterviews.map((row, idx) => (
                <tr key={row._id || row.id || idx}>
                  <td className="px-4 py-3 text-slate-500">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3">{row.companyName || '-'}</td>
                  <td className="px-4 py-3">{row.jobRole || '-'}</td>
                  <td className="px-4 py-3">{rowDate(row) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${selectionChanceBadge(rowSelectionChances(row))}`}>{rowSelectionChances(row) || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedInterview(row)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        aria-label="View interview"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/cms/candidates/${id}/edit?panel=interviews`)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No interviews.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <InterviewDetailsPanel row={selectedInterview} onClose={() => setSelectedInterview(null)} />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={interviews.length}
          itemLabel="interviews"
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  )
}

