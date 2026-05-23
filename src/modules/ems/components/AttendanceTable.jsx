const punchTime = (value) => value?.time || value
const formatTime = (value) => (punchTime(value) ? new Date(punchTime(value)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-')

const statusStyle = {
  present: 'bg-emerald-50 text-emerald-700',
  late: 'bg-amber-50 text-amber-700',
  absent: 'bg-rose-50 text-rose-700',
  half_day: 'bg-blue-50 text-blue-700',
  leave: 'bg-purple-50 text-purple-700'
}

export default function AttendanceTable({ rows = [] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Worked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const attendance = row.attendance || row
              const employee = row.employee || attendance.employee || {}
              const name = employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
              return (
                <tr key={attendance._id || `${employee._id}-${attendance.date}`} className="text-slate-700">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{name || 'Employee'}</p>
                    <p className="text-xs text-slate-500">{employee.employeeId || '-'}</p>
                  </td>
                  <td className="px-4 py-3">{formatDate(attendance.date)}</td>
                  <td className="px-4 py-3">{formatTime(attendance.checkIn)}</td>
                  <td className="px-4 py-3">{formatTime(attendance.checkOut)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[attendance.status] || 'bg-slate-100 text-slate-600'}`}>
                      {attendance.status || 'absent'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{attendance.workingHours ? `${attendance.workingHours}h` : attendance.minutesWorked ? `${Math.round(attendance.minutesWorked / 60)}h` : '-'}</td>
                </tr>
              )
            })}
            {!rows.length ? (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">No attendance records found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
