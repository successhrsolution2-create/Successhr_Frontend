import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import JSZip from 'jszip'
import api from '../../../../api/axios'
import { createCandidateExcelWorkbook } from './AddCandidate'
import { mapApiToCandidateForm } from './candidateFormModel'

const ExportCandidateModal = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  if (!isOpen) return null

  const handleExport = async (e) => {
    e.preventDefault()
    
    if (!startDate && !endDate) {
      toast.error('Please select at least one date filter (Start or End)')
      return
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Start Date cannot be after End Date')
      return
    }

    try {
      setExporting(true)
      
      const queryParams = new URLSearchParams()
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const response = await api.get(`/cms/candidates/export?${queryParams.toString()}`)
      const candidates = response.data

      if (!candidates || candidates.length === 0) {
        toast.error('No candidates found for this date range')
        setExporting(false)
        return
      }

      toast.success(`Bundling ${candidates.length} candidates...`)

      const zip = new JSZip()

      candidates.forEach((rawCandidate) => {
        const candidate = mapApiToCandidateForm(rawCandidate)
        const xmlString = createCandidateExcelWorkbook(candidate)
        const safeName = (candidate.fullName || 'Candidate').replace(/[^a-z0-9]/gi, '_')
        const fileName = `${safeName}_${candidate.candidateCode || rawCandidate._id}.xls`
        zip.file(fileName, xmlString)
      })

      const blob = await zip.generateAsync({ type: 'blob' })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `CandidatesExport_${new Date().toISOString().slice(0, 10)}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('ZIP file downloaded successfully')
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error.response?.data?.message || 'Failed to export candidates')
    } finally {
      setExporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-800">Export Candidates ZIP</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExport} className="p-6 space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Select a date range to export candidates based on their Registration Date. This will download a single ZIP file containing separate Excel files for each candidate.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exporting}
                    className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Export ZIP'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ExportCandidateModal
