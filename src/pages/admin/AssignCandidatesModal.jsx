import { useEffect, useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

export default function AssignCandidatesModal({ onClose, onAssignSuccess }) {
  const [candidates, setCandidates] = useState([])
  const [companies, setCompanies] = useState([])
  
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [interviewDate, setInterviewDate] = useState('')

  useEffect(() => {
    api.get('/cms/candidates')
      .then((res) => setCandidates(res.data.candidates || []))
      .catch(() => toast.error('Failed to load CMS candidates'))
      .finally(() => setLoadingCandidates(false))

    api.get('/company-management/admins')
      .then((res) => setCompanies(res.data.admins || []))
      .catch(() => toast.error('Failed to load Companies'))
      .finally(() => setLoadingCompanies(false))
  }, [])

  const filteredCandidates = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return candidates
    return candidates.filter(c => 
      c.fullName?.toLowerCase().includes(term) ||
      c.mobileNumber?.includes(term) ||
      c.education?.toLowerCase().includes(term) ||
      c.experienceDepartment?.toLowerCase().includes(term)
    )
  }, [candidates, search])

  const toggleCandidate = (id) => {
    setSelectedCandidates(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set())
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c._id)))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (selectedCandidates.size === 0) return toast.error('Select at least one candidate')
    if (!selectedCompanyId) return toast.error('Select a company')
    
    setSubmitting(true)
    try {
      await api.post('/company-management/interview-info/assign', {
        companyAdminId: selectedCompanyId,
        candidateIds: Array.from(selectedCandidates),
        interviewDateTime: interviewDate
      })
      toast.success('Candidates assigned successfully')
      onAssignSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign candidates')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-3 py-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Assign Candidates</h2>
            <p className="mt-1 text-sm text-slate-500">Select CMS candidates to send to a company.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-5 bg-slate-50/50">
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Select Company <span className="text-rose-500">*</span>
              <select 
                value={selectedCompanyId} 
                onChange={e => setSelectedCompanyId(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">-- Choose Company --</option>
                {loadingCompanies ? <option disabled>Loading...</option> : null}
                {companies.map(c => <option key={c._id} value={c._id}>{c.companyName} ({c.name})</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Interview Date & Time
              <input 
                type="datetime-local" 
                value={interviewDate} 
                onChange={e => setInterviewDate(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates by name, phone, education..."
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-sky-500"
              />
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {selectedCandidates.size} selected
            </span>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-[13px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                      checked={filteredCandidates.length > 0 && selectedCandidates.size === filteredCandidates.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-2.5">Candidate Name</th>
                  <th className="px-4 py-2.5">Education</th>
                  <th className="px-4 py-2.5">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCandidates ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">Loading candidates...</td>
                  </tr>
                ) : filteredCandidates.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <input 
                        type="checkbox" 
                        checked={selectedCandidates.has(c._id)}
                        onChange={() => toggleCandidate(c._id)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">{c.fullName}</td>
                    <td className="px-4 py-2 text-slate-600">{c.education || '-'}</td>
                    <td className="px-4 py-2 text-slate-600">{c.experienceDepartment || c.interestedDepartment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={submit}
            disabled={submitting || selectedCandidates.size === 0 || !selectedCompanyId}
            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
          >
            {submitting ? 'Assigning...' : `Assign ${selectedCandidates.size} Candidate(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}
