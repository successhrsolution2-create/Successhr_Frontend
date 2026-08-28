import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const blankEmployee = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  dateOfBirth: '',
  gender: '',
  department: '',
  designation: '',
  employmentType: 'Full-time',
  status: 'active',
  joiningDate: '',
  role: 'candidate_admin',
  workLocation: ''
}

const steps = ['Personal', 'Job']

const inputClass = 'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function EmployeeForm({ initialValue, onSubmit, submitting = false, submitLabel = 'Save Employee' }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(() => ({
    ...blankEmployee,
    ...initialValue,
    department: initialValue?.department?._id || initialValue?.department || ''
  }))

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = { ...form }
    if (!payload.password) delete payload.password
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${step === index ? 'bg-[#00427d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {step === 0 ? (
          <>
            <Field label="Employee ID" value={form.employeeId} onChange={(value) => update('employeeId', value)} />
            <Field label="First Name" value={form.firstName} onChange={(value) => update('firstName', value)} required />
            <Field label="Last Name" value={form.lastName} onChange={(value) => update('lastName', value)} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
            <Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
            <Field
              label="Temporary Password"
              type="password"
              value={form.password}
              onChange={(value) => update('password', value)}
              required={!initialValue?._id && ['candidate_admin', 'manager', 'crm_employee'].includes(form.role)}
            />
            <Field label="Date of Birth" type="date" value={form.dateOfBirth?.slice?.(0, 10) || form.dateOfBirth || ''} onChange={(value) => update('dateOfBirth', value)} />
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Gender
              <select value={form.gender || ''} onChange={(event) => update('gender', event.target.value)} className={inputClass}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </label>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="Department" value={form.department} onChange={(value) => update('department', value)} />
            <Field label="Designation" value={form.designation} onChange={(value) => update('designation', value)} />
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Employment Type
              <select value={form.employmentType} onChange={(event) => update('employmentType', event.target.value)} className={inputClass}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Intern</option>
                <option>Consultant</option>
              </select>
            </label>
            <Field label="Joining Date" type="date" value={form.joiningDate?.slice?.(0, 10) || form.joiningDate || ''} onChange={(value) => update('joiningDate', value)} />
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Login Role
              <select value={form.role} onChange={(event) => update('role', event.target.value)} className={inputClass}>
                <option value="candidate_admin">Candidate Management</option>
                <option value="manager">Manager</option>
                <option value="crm_employee">CRM Admin</option>
              </select>
            </label>
            <Field label="Work Location" value={form.workLocation} onChange={(value) => update('workLocation', value)} />
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
        <button 
          type="button" 
          onClick={() => {
            if (step > 0) {
              setStep((current) => current - 1)
            } else {
              navigate(-1)
            }
          }} 
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        <div className="flex gap-2">
          {step < steps.length - 1 ? (
            <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Next
            </button>
          ) : null}
          <button type="submit" disabled={submitting} className="rounded-md bg-[#00427d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#063763] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} required={required} className={inputClass} />
    </label>
  )
}
