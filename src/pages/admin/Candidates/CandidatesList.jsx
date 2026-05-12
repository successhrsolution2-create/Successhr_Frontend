import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CalendarDays,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2
} from 'lucide-react'

import api from '../../../api/axios'
import Skeleton from '../../../components/Skeleton'
import { ConfirmDialog } from '../../../components/ActionDialogs'

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export default function CandidatesList() {
  const navigate = useNavigate()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get('/cms/candidates', {
        params: search.trim()
          ? { search: search.trim() }
          : undefined
      })

      setCandidates(data)
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to load candidates'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return candidates

    return candidates.filter((candidate) => {
      const fields = [
        candidate.fullName,
        candidate.mobileNumber,
        candidate.emailId,
        ...(candidate.keySkills || [])
      ]

      return fields.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      )
    })
  }, [candidates, search])

  const handleDelete = async () => {
    if (!deleting?._id) return

    try {
      await api.delete(`/cms/candidates/${deleting._id}`)

      setCandidates((current) =>
        current.filter(
          (item) => item._id !== deleting._id
        )
      )

      toast.success('Candidate deleted')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not delete candidate'
      )
    } finally {
      setDeleting(null)
    }
  }

  const exportCsv = () => {
    try {
      const headers = [
        'Full Name',
        'Mobile Number',
        'Email',
        'Education',
        'Total Experience',
        'Current Salary',
        'Expected Salary',
        'Preferred Location',
        'Key Skills'
      ]

      const rows = filtered.map((item) => [
        item.fullName,
        item.mobileNumber,
        item.emailId,
        item.education,
        item.totalExperience,
        item.currentSalary,
        item.expectedSalary,
        item.preferredLocation,
        (item.keySkills || []).join(' | ')
      ])

      const csv = [headers, ...rows]
        .map((row) =>
          row.map(csvCell).join(',')
        )
        .join('\n')

      const blob = new Blob(
        [`\uFEFF${csv}`],
        {
          type: 'text/csv;charset=utf-8;'
        }
      )

      const url =
        URL.createObjectURL(blob)

      const link =
        document.createElement('a')

      link.href = url
      link.download = `cms-candidates-${Date.now()}.csv`
      link.click()

      URL.revokeObjectURL(url)

      toast.success('CSV exported')
    } catch (_error) {
      toast.error('Could not export CSV')
    }
  }

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Candidate Management
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Candidates
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage candidate profiles, skills,
            interviews and hiring workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/admin/cms/candidates/new'
              )
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by candidate name, mobile, email or skills..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4" />
            Date Range
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Candidate
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Mobile
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Education
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Experience
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Salary
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Job Role
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Skills
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map((candidate) => (
                <tr
                  key={candidate._id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold capitalize text-slate-900">
                        {candidate.fullName}
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        ID: {candidate._id.slice(-8)}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-700">
                    {candidate.mobileNumber}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {candidate.education ||
                      '-'}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {candidate.totalExperience ??
                      '-'}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {candidate.currentSalary ||
                      '-'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      Not Assigned
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(candidate.keySkills || [])
                        .slice(0, 3)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                          >
                            {skill}
                          </span>
                        ))}

                      {!candidate.keySkills
                        ?.length && (
                        <span className="text-slate-400">
                          -
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/cms/candidates/${candidate._id}`
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-sky-50 hover:text-sky-600"
                        aria-label="View candidate"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/cms/candidates/${candidate._id}/edit`
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-amber-50 hover:text-amber-600"
                        aria-label="Edit candidate"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleting(candidate)
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete candidate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Candidate"
        message={`Delete ${
          deleting?.fullName ||
          'this candidate'
        }? Interviews and remarks will also be deleted.`}
        confirmText="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}