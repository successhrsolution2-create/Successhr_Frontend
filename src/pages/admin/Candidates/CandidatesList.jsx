import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, Trash2, Download, Plus } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../../api/axios'
import DetailDrawer from '../../../components/DetailDrawer'
import StatusBadge from '../../../components/StatusBadge'
import Skeleton from '../../../components/Skeleton'
import AddCandidateModal from './AddCandidateModal'

export default function CandidatesList() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  })
  const [selected, setSelected] = useState(null)
  const [openModal, setOpenModal] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/candidates')
      setCandidates(data)
    } catch {
      toast.error('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()

    return candidates
      .filter((c) =>
        search
          ? `${c.name} ${c.mobile}`.toLowerCase().includes(search)
          : true
      )
      .filter((c) =>
        filters.status === 'all' ? true : c.status === filters.status
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [candidates, filters])

  const deleteCandidate = async (candidate) => {
    if (!window.confirm(`Delete ${candidate.name}?`)) return

    try {
      await api.delete(`/candidates/${candidate._id}`)
      setCandidates((prev) =>
        prev.filter((item) => item._id !== candidate._id)
      )
      toast.success('Candidate deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  // ✅ CSV EXPORT
  const csvCell = (value) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`

  const exportCsv = () => {
    try {
      const headers = [
        'Candidate Name',
        'Mobile',
        'Applied For',
        'Submitted By',
        'Date',
        'Status',
        'Next Process'
      ]

      const rows = filtered.map((c) => [
        c.name,
        c.mobile,
        c.appliedFor,
        c.submittedBy?.name || 'Admin',
        format(new Date(c.createdAt), 'yyyy-MM-dd'),
        c.status,
        c.nextProcess || ''
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(','))
        .join('\n')

      const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;'
      })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `candidates-${Date.now()}.csv`
      link.click()

      toast.success('CSV downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  if (loading) return <Skeleton rows={8} />

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500">
            Search, filter, view, and manage candidates.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid gap-3 md:grid-cols-3 bg-white p-4 rounded-xl shadow-sm ring-1 ring-slate-200">
        
        {/* Search */}
        <input
          placeholder="Search by name or mobile"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="border px-3 py-2 rounded-lg"
        />

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
          className="border px-3 py-2 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="not_viewed">Not Viewed</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </select>

        {/* ✅ Add Candidate Button (Fixed) */}
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Candidate
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Applied For</th>
                <th className="px-5 py-3">Submitted By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Next Process</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold">{c.name}</td>
                  <td className="px-5 py-3">{c.mobile}</td>
                  <td className="px-5 py-3">{c.appliedFor || '-'}</td>
                  <td className="px-5 py-3">
                    {c.submittedBy?.name || 'Admin'}
                  </td>
                  <td className="px-5 py-3">
                    {format(new Date(c.createdAt), 'dd MMM yyyy')}
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>

                  <td className="px-5 py-3">
                    {c.nextProcess || '-'}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-blue-600"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => deleteCandidate(c)}
                        className="text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500">
                    No candidates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER */}
      <DetailDrawer
        open={!!selected}
        item={selected}
        type="candidate"
        onClose={() => setSelected(null)}
      />

      {/* ✅ ADD CANDIDATE MODAL */}
      <AddCandidateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  )
}