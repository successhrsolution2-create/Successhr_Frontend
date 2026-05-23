const styles = {
  pending_manager: 'bg-amber-50 text-amber-700 ring-amber-200',
  pending_hr: 'bg-blue-50 text-blue-700 ring-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200'
}

const labels = {
  pending_manager: 'Manager Pending',
  pending_hr: 'HR Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
}

export default function LeaveStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] || styles.cancelled}`}>
      {labels[status] || status || 'Unknown'}
    </span>
  )
}
