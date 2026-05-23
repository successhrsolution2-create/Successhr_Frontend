import { useEffect, useState } from 'react'
import { FileText, Upload, Trash2 } from 'lucide-react'
import { documentApi } from '../../api/documentApi'
import { employeeApi } from '../../api/employeeApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
const dateText = (value) => (value ? new Date(value).toLocaleDateString() : '-')

export default function DocumentManager() {
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [documents, setDocuments] = useState([])
  const [form, setForm] = useState({ title: '', documentType: 'Other', expiryDate: '', file: null })
  const [error, setError] = useState('')

  useEffect(() => {
    employeeApi.list({ limit: 100 }).then(({ data }) => {
      const items = data.items || []
      setEmployees(items)
      setEmployeeId(items[0]?._id || '')
    }).catch(() => setEmployees([]))
  }, [])

  const loadDocuments = () => {
    if (!employeeId) return
    documentApi.employee(employeeId).then(({ data }) => setDocuments(data.items || [])).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load documents')
    })
  }

  useEffect(() => {
    loadDocuments()
  }, [employeeId])

  const upload = async (event) => {
    event.preventDefault()
    if (!form.file) return
    const data = new FormData()
    data.append('employeeId', employeeId)
    data.append('title', form.title)
    data.append('documentType', form.documentType)
    data.append('expiryDate', form.expiryDate)
    data.append('file', form.file)

    setError('')
    try {
      await documentApi.upload(data)
      setForm({ title: '', documentType: 'Other', expiryDate: '', file: null })
      event.target.reset()
      loadDocuments()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload document')
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      await documentApi.remove(id)
      loadDocuments()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete document')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">Upload, preview, and track employee documents.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={upload} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Employee
            <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className={inputClass} required>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>{employee.employeeId} · {employee.firstName} {employee.lastName}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Type
            <select value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })} className={inputClass}>
              <option>Offer Letter</option>
              <option>ID Proof</option>
              <option>Certificate</option>
              <option>Experience Letter</option>
              <option>Other</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Expiry Date
            <input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className={inputClass} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            File
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} className="text-sm text-slate-700" required />
          </label>
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
            <Upload className="h-4 w-4" /> Upload
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {documents.map((document) => (
            <div key={document._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <a href={document.url} target="_blank" rel="noreferrer" className="truncate text-sm font-bold text-slate-950 hover:text-sky-700">{document.title}</a>
                  <p className="text-xs text-slate-500">{document.documentType} · expires {dateText(document.expiryDate)}</p>
                </div>
              </div>
              <button type="button" onClick={() => remove(document._id)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Delete document">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!documents.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">No documents for this employee.</div> : null}
        </div>
      </div>
    </div>
  )
}
