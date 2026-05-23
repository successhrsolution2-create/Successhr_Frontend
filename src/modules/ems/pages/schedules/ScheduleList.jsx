import { useEffect, useState } from 'react'
import { CalendarClock, Trash2 } from 'lucide-react'
import { employeeApi } from '../../api/employeeApi'
import { locationApi } from '../../api/locationApi'
import { scheduleApi } from '../../api/scheduleApi'

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const blankForm = {
  employee: '',
  officeLocation: '',
  workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  shiftStart: '09:00',
  shiftEnd: '18:00',
  graceMinutes: 15
}

export default function ScheduleList() {
  const [employees, setEmployees] = useState([])
  const [locations, setLocations] = useState([])
  const [schedules, setSchedules] = useState([])
  const [form, setForm] = useState(blankForm)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')

  const loadSchedules = () => {
    scheduleApi.list({ limit: 100 }).then(({ data }) => setSchedules(data.items || [])).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load schedules')
    })
  }

  useEffect(() => {
    employeeApi.list({ limit: 200 }).then(({ data }) => setEmployees(data.items || [])).catch(() => setEmployees([]))
    locationApi.list({ limit: 100, isActive: true }).then(({ data }) => setLocations(data.items || [])).catch(() => setLocations([]))
    loadSchedules()
  }, [])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      employee: current.employee || employees[0]?._id || '',
      officeLocation: current.officeLocation || locations[0]?._id || ''
    }))
  }, [employees, locations])

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      workDays: current.workDays.includes(day)
        ? current.workDays.filter((item) => item !== day)
        : [...current.workDays, day]
    }))
  }

  const save = async (event) => {
    event.preventDefault()
    setError('')
    try {
      if (editingId) await scheduleApi.update(editingId, form)
      else await scheduleApi.create(form)
      setForm({ ...blankForm, employee: employees[0]?._id || '', officeLocation: locations[0]?._id || '' })
      setEditingId('')
      loadSchedules()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save schedule')
    }
  }

  const edit = (schedule) => {
    setEditingId(schedule._id)
    setForm({
      employee: schedule.employee?._id || schedule.employee,
      officeLocation: schedule.officeLocation?._id || schedule.officeLocation,
      workDays: schedule.workDays || blankForm.workDays,
      shiftStart: schedule.shiftStart || '09:00',
      shiftEnd: schedule.shiftEnd || '18:00',
      graceMinutes: schedule.graceMinutes || 15
    })
  }

  const remove = async (id) => {
    setError('')
    try {
      await scheduleApi.remove(id)
      loadSchedules()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove schedule')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Work Schedules</h1>
        <p className="mt-1 text-sm text-slate-600">Assign each employee to an office location and shift.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <form onSubmit={save} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-sm font-semibold text-slate-700 xl:col-span-2">
            Employee
            <select value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })} className={inputClass} required>
              {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.employeeId} · {employee.firstName} {employee.lastName}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700 xl:col-span-2">
            Office Location
            <select value={form.officeLocation} onChange={(event) => setForm({ ...form, officeLocation: event.target.value })} className={inputClass} required>
              {locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Grace
            <input type="number" min="0" max="240" value={form.graceMinutes} onChange={(event) => setForm({ ...form, graceMinutes: event.target.value })} className={inputClass} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Shift Start
            <input type="time" value={form.shiftStart} onChange={(event) => setForm({ ...form, shiftStart: event.target.value })} className={inputClass} required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Shift End
            <input type="time" value={form.shiftEnd} onChange={(event) => setForm({ ...form, shiftEnd: event.target.value })} className={inputClass} required />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {workDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${form.workDays.includes(day) ? 'bg-[#00427d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#00427d] px-4 text-sm font-semibold text-white hover:bg-[#063763]">
            <CalendarClock className="h-4 w-4" /> {editingId ? 'Update Schedule' : 'Assign Schedule'}
          </button>
          {editingId ? (
            <button type="button" onClick={() => { setEditingId(''); setForm({ ...blankForm, employee: employees[0]?._id || '', officeLocation: locations[0]?._id || '' }) }} className="rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedules.map((schedule) => (
              <tr key={schedule._id}>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => edit(schedule)} className="text-left font-semibold text-slate-950 hover:text-sky-700">
                    {schedule.employee?.firstName} {schedule.employee?.lastName}
                  </button>
                  <p className="text-xs text-slate-500">{schedule.employee?.employeeId}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{schedule.officeLocation?.name || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{schedule.shiftStart} - {schedule.shiftEnd} · {schedule.graceMinutes}m grace</td>
                <td className="px-4 py-3 text-slate-600">{schedule.workDays?.join(', ')}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => remove(schedule._id)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Remove schedule">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!schedules.length ? <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No schedules assigned.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
