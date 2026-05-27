import { Edit, Mail, Phone, Trash2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const roleLabels = {
  candidate_admin: 'Candidate Management',
  crm_employee: 'CRM Admin',
  manager: 'Manager',
  employee: 'Employee',
  hr: 'HR',
  admin: 'Admin',
  ems_super_admin: 'EMS Super Admin'
}

export default function EmployeeCard({ employee, onDelete }) {
  const name = employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow">
      <Link to={`/ems/employees/${employee._id}`} className="block">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-slate-950">{name || 'Unnamed Employee'}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{employee.employeeId}</span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">{roleLabels[employee.role] || employee.role || 'Employee'}</span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{employee.designation || 'No designation'} - {employee.department?.name || 'No department'}</p>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{employee.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>{employee.phone || 'No phone'}</span>
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <Link to={`/ems/employees/${employee._id}/edit`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Edit className="h-3.5 w-3.5" /> Edit
        </Link>
        <button type="button" onClick={() => onDelete?.(employee)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  )
}
