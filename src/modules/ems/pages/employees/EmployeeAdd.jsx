import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeForm from '../../components/EmployeeForm'
import { employeeApi } from '../../api/employeeApi'

export default function EmployeeAdd() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await employeeApi.create(payload)
      navigate(`/ems/employees/${data.employee._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Add Employee</h1>
        <p className="mt-1 text-sm text-slate-600">Create the employee profile, job details, and salary structure.</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <EmployeeForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create Employee" />
    </div>
  )
}
