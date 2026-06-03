import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EmployeeForm from '../../components/EmployeeForm'
import { employeeApi } from '../../api/employeeApi'

const roleOptions = new Set(['candidate_admin', 'manager', 'crm_employee'])

export default function EmployeeAdd() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRole = searchParams.get('role')
  const initialRole = roleOptions.has(requestedRole) ? requestedRole : 'candidate_admin'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setError('')
    try {
      await employeeApi.create(payload)
      navigate('/ems/employees', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Add Role Account</h1>
        <p className="mt-1 text-sm text-slate-600">Create Candidate Management, Manager, or CRM Admin login access.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <EmployeeForm initialValue={{ role: initialRole }} onSubmit={handleSubmit} submitting={submitting} submitLabel="Create Account" />
    </div>
  )
}
