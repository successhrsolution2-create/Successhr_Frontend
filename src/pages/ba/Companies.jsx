import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../socket'
import DetailDrawer from '../../components/DetailDrawer'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

export default function Companies() {
  const token = useSelector((state) => state.auth.token)
  const [companies, setCompanies] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  })

  const loadData = async () => {
    const [companyRes, placementRes] = await Promise.all([api.get('/companies'), api.get('/placements/my')])
    setCompanies(companyRes.data)
    setPlacements(placementRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData().catch(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!token) return undefined
    connectSocket(token)

    const refresh = () => {
      loadData().catch(() => {})
    }

    socket.on('my_placement', refresh)
    socket.on('placement_updated', refresh)
    socket.on('earning_paid', refresh)
    socket.on('commission_paid', refresh)
    socket.on('company_updated', refresh)
    socket.on('company_deleted', refresh)

    return () => {
      socket.off('my_placement', refresh)
      socket.off('placement_updated', refresh)
      socket.off('earning_paid', refresh)
      socket.off('commission_paid', refresh)
      socket.off('company_updated', refresh)
      socket.off('company_deleted', refresh)
      disconnectSocket()
    }
  }, [token])

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return companies
      .filter((company) => {
        if (!search) return true
        const job = company.jobRequirements || {}
        const text = [
          company.companyName,
          company.companyAddress,
          company.contactPersonName,
          company.contactPersonDesignation,
          company.mobileNo,
          company.emailId,
          job.jobProfile,
          job.jobLocation,
          job.education,
          job.experience,
          ...(job.requiredKeySkills || [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return text.includes(search)
      })
      .filter((company) => (filters.status === 'all' ? true : company.status === filters.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [companies, filters])

  const stats = useMemo(() => {
    const totalSubmitted = companies.length
    const inReviewActive = companies.filter(
      (company) => company.status === 'in_review' || company.status === 'priority'
    ).length
    const companyIdsWithPlacements = new Set(
      placements.map((placement) => placement.company?._id).filter(Boolean)
    )
    const studentsPlacedViaMyCompanies = companyIdsWithPlacements.size
    return { totalSubmitted, inReviewActive, studentsPlacedViaMyCompanies }
  }, [companies, placements])

  if (loading) return <Skeleton rows={10} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">My Companies</h1>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {companies.length}
          </span>
        </div>
        <Link
          to="/ba/companies/new"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add Company
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Submitted" value={stats.totalSubmitted} />
        <StatCard label="In Review / Active" value={stats.inReviewActive} />
        <StatCard label="Students Placed Via My Companies" value={stats.studentsPlacedViaMyCompanies} />
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search by company, contact, phone, email, job..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="not_viewed">Not Viewed</option>
          <option value="in_review">In Review</option>
          <option value="priority">Priority</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Contact Person</th>
                <th className="px-5 py-3">Job Profile</th>
                <th className="px-5 py-3">Vacancies</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((company) => (
                <tr
                  key={company._id}
                  onClick={() => setSelected(company)}
                  className="cursor-pointer odd:bg-white even:bg-slate-50 hover:bg-indigo-50/50"
                >
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">{company.companyName}</p>
                    <p className="text-xs text-slate-500">{company.companyAddress || 'No address'}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{company.contactPersonName || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-700">{company.jobRequirements?.jobProfile || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-700">{company.jobRequirements?.numberOfVacancy || 'Not provided'}</td>
                  <td className="px-5 py-3 text-slate-600">{format(new Date(company.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={company.status} />
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    No companies found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer
        open={Boolean(selected)}
        item={selected}
        type="company"
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
