import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileText, Download, Trash2, ArrowLeft, Plus, Pencil, Eye } from 'lucide-react'
import api from '../../../api/axios'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import download from 'downloadjs'

export default function CandidateDocuments() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    contactPerson: '',
    postOf: '',
    ilNumber: '',
    interviewDate: '',
    interviewTime: ''
  })
  const [saving, setSaving] = useState(false)
  const [editingDocId, setEditingDocId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const docTypes = ['Interview Letter', 'Receipt', 'Consent Letter', 'Hami patra']

  const loadData = async () => {
    setLoading(true)
    try {
      // Load candidate
      const { data: candData } = await api.get(`/cms/candidates/${id}`)
      setCandidate(candData.candidate || candData)
      
      // Load generated documents
      const { data: docsData } = await api.get(`/cms/candidates/${id}/generated-documents`)
      setDocuments(docsData)
    } catch (error) {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const handleCreate = async (e) => {
    e.preventDefault()
    
    if (!selectedType) {
      return toast.error('Please select a document type')
    }

    setSaving(true)
    try {
      const payload = {
        documentType: selectedType,
        data: {
          name: candidate?.fullName || '',
          ...formData
        }
      }

      if (editingDocId) {
        await api.put(`/cms/candidates/${id}/generated-documents/${editingDocId}`, payload)
        toast.success('Document updated successfully')
      } else {
        await api.post(`/cms/candidates/${id}/generated-documents`, payload)
        toast.success('Document created successfully')
      }
      
      setShowCreateModal(false)
      setSelectedType('')
      setEditingDocId(null)
      setFormData({ companyName: '', companyAddress: '', contactPerson: '', postOf: '', ilNumber: '', interviewDate: '', interviewTime: '' })
      loadData()
    } catch (error) {
      toast.error(`Failed to ${editingDocId ? 'update' : 'create'} document`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (doc) => {
    setEditingDocId(doc._id)
    setSelectedType(doc.documentType)
    setFormData({
      companyName: doc.data?.companyName || '',
      companyAddress: doc.data?.companyAddress || '',
      contactPerson: doc.data?.contactPerson || '',
      postOf: doc.data?.postOf || '',
      ilNumber: doc.data?.ilNumber || '',
      interviewDate: doc.data?.interviewDate || '',
      interviewTime: doc.data?.interviewTime || ''
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    
    setDeletingId(docId)
    try {
      await api.delete(`/cms/candidates/${id}/generated-documents/${docId}`)
      toast.success('Document deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (val) => {
    if (!val) return '-'
    if (typeof val === 'string') {
      // Split by T to handle both YYYY-MM-DD and ISO strings
      const datePart = val.split('T')[0]
      if (datePart.includes('-') && datePart.length === 10) {
        const [y, m, d] = datePart.split('-')
        return `${d}/${m}/${y}`
      }
    }
    const d = new Date(val)
    if (isNaN(d)) return '-'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (val) => {
    if (!val) return '-'
    const d = new Date(val)
    if (isNaN(d)) return '-'
    return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  }

  const generatePDFBytes = async (doc) => {
    const existingPdfBytes = await fetch('/templates/interview-letter-template.pdf').then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    // Helper to draw text perfectly over the blank lines
    const drawField = (text, x, y, width, size = 12, center = false) => {
      if (text) {
        const textStr = String(text)
        let textX = x + 5
        if (center) {
          const textWidth = helveticaFont.widthOfTextAtSize(textStr, size)
          textX = x + (width / 2) - (textWidth / 2)
        }
        firstPage.drawText(textStr, {
          x: textX,
          y,
          size,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        })
      }
    }

    const candData = doc.data || {}
    
    const candName = candData.name || candidate?.fullName || ''

    if (candData.ilNumber) {
      drawField(candData.ilNumber, 98, 591, 110, 11, false)
    }

    const fmtInterviewDate = formatDate(candData.interviewDate)
    drawField(fmtInterviewDate, 510, 567, 90, 11, false)
    drawField(`Mr ${candName}`, 104, 519, 470, 16, false)
    drawField(candData.contactPerson || '', 126, 470, 440, 12, false)
    drawField(candData.postOf || '', 285, 444, 130, 12, false)
    drawField(fmtInterviewDate, 485, 444, 90, 11, false)
    drawField(candData.interviewTime || '', 40, 429, 150, 11, false)
    drawField(candData.companyName || '', 140, 383, 430, 12, false)
    drawField(candData.companyAddress || '', 150, 356, 420, 12, false)
    drawField(candName, 85, 229, 180, 12, false)

    return await pdfDoc.save()
  }

  const handlePreviewPDF = async (doc) => {
    try {
      const toastId = toast.loading('Generating preview...')
      const pdfBytes = await generatePDFBytes(doc)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast.dismiss(toastId)
    } catch (error) {
      console.error(error)
      toast.error('Failed to preview PDF')
    }
  }

  const handleDownloadPDF = async (doc) => {
    try {
      const toastId = toast.loading('Generating PDF...')
      const pdfBytes = await generatePDFBytes(doc)
      const candName = doc.data?.name || candidate?.fullName || ''
      download(pdfBytes, `${candName.replace(/\s+/g, '_')}_Interview_Letter.pdf`, 'application/pdf')
      toast.dismiss(toastId)
      toast.success('PDF downloaded!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleTypeChange = (e) => {
    const type = e.target.value
    setSelectedType(type)
    
    if (!editingDocId) {
      // Find the most recent document of this type
      const existingDocs = documents.filter(d => d.documentType === type)
      if (existingDocs.length > 0) {
        // Sort by createdAt descending to get the latest
        existingDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        const latest = existingDocs[0]
        setFormData({
          companyName: latest.data?.companyName || '',
          companyAddress: latest.data?.companyAddress || '',
          contactPerson: latest.data?.contactPerson || '',
          postOf: latest.data?.postOf || '',
          ilNumber: latest.data?.ilNumber || '',
          interviewDate: latest.data?.interviewDate || '',
          interviewTime: latest.data?.interviewTime || ''
        })
      } else {
        setFormData({ companyName: '', companyAddress: '', contactPerson: '', postOf: '', ilNumber: '', interviewDate: '', interviewTime: '' })
      }
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/admin/cms/candidates/${id}`)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Generated Documents
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Candidate: <span className="text-indigo-600 font-semibold">{candidate?.fullName || 'Loading...'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingDocId(null)
            setSelectedType('')
            setFormData({ companyName: '', companyAddress: '', contactPerson: '', postOf: '', ilNumber: '', interviewDate: '', interviewTime: '' })
            setShowCreateModal(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create Document
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-sm font-medium text-slate-500">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No documents yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6 max-w-sm text-center">
                  You haven't generated any documents for this candidate yet.
                </p>
                <button
                  onClick={() => {
                    setEditingDocId(null)
                    setSelectedType('')
                    setFormData({ companyName: '', companyAddress: '', contactPerson: '', postOf: '', ilNumber: '', interviewDate: '', interviewTime: '' })
                    setShowCreateModal(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
                >
                  <Plus size={16} />
                  Create First Document
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Document Type</th>
                    <th className="px-6 py-4">Generated Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText size={16} />
                        </div>
                        {doc.documentType}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateTime(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Edit Document"
                            onClick={() => handleEditClick(doc)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition hover:bg-slate-200"
                          >
                            <Pencil size={16} />
                          </button>
                          {doc.documentType === 'Interview Letter' ? (
                            <>
                              <button
                                title="Preview PDF"
                                onClick={() => handlePreviewPDF(doc)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                title="Download/Print PDF"
                                onClick={() => handleDownloadPDF(doc)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                              >
                                <Download size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium px-2 py-1 rounded bg-amber-50">Pending Layout</span>
                          )}
                          <button
                            title="Delete"
                            onClick={() => handleDelete(doc._id)}
                            disabled={deletingId === doc._id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">{editingDocId ? 'Edit Document' : 'Create New Document'}</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="overflow-y-auto p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Document Type</label>
                <select
                  value={selectedType}
                  onChange={handleTypeChange}
                  disabled={!!editingDocId}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  required
                >
                  <option value="" disabled hidden>Select document type</option>
                  {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {selectedType === 'Interview Letter' && (
                <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                  <h3 className="text-sm font-bold text-indigo-900 border-b border-indigo-100 pb-2">Interview Letter Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">IL. Number <span className="text-slate-400 font-normal">(next to IL. NO. - SJP –)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. 11553"
                        value={formData.ilNumber}
                        onChange={e => setFormData({ ...formData, ilNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HFL"
                        value={formData.companyName}
                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Company Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Ambad MIDC, Nashik"
                      value={formData.companyAddress}
                      onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Contact Person</label>
                      <input
                        type="text"
                        placeholder="e.g. Mr. Swapnil Ugale Sir"
                        value={formData.contactPerson}
                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Post Of (Role)</label>
                      <input
                        type="text"
                        placeholder="e.g. Machine Operator"
                        value={formData.postOf}
                        onChange={e => setFormData({ ...formData, postOf: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Dated On <span className="text-slate-400 font-normal">(interview date)</span></label>
                      <input
                        type="date"
                        value={formData.interviewDate}
                        onChange={e => setFormData({ ...formData, interviewDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">At <span className="text-slate-400 font-normal">(interview time)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. 10:00 AM to 5:00 PM"
                        value={formData.interviewTime}
                        onChange={e => setFormData({ ...formData, interviewTime: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType && selectedType !== 'Interview Letter' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    Layout for <b>{selectedType}</b> will be provided later. For now, it will generate a blank template record.
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? (editingDocId ? 'Updating...' : 'Creating...') : (editingDocId ? 'Update Document' : 'Create Document')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
