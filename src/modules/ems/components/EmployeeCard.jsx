import { Mail, Phone, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EmployeeCard({ employee }) {
  const name = employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim()

  return (
    <Link to={`/ems/employees/${employee._id}`} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <UserRound className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-slate-950">{name || 'Unnamed Employee'}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{employee.employeeId}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{employee.designation || 'No designation'} · {employee.department?.name || 'No department'}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> <span className="truncate">{employee.email}</span></p>
            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> <span>{employee.phone || 'No phone'}</span></p>
          </div>
        </div>
      </div>
    </Link>
  )
}
