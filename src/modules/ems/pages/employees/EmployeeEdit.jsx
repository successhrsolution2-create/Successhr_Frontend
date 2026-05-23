import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmployeeForm from '../../components/EmployeeForm'
import { employeeApi } from '../../api/employeeApi'

export default function EmployeeEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    employeeApi.get(id).then(({ data }) => setEmployee(data.employee)).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load employee')
    }).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setError('')
    try {
      await employeeApi.update(id, payload)
      navigate(`/ems/employees/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update employee')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading employee...</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Edit Employee</h1>
        <p className="mt-1 text-sm text-slate-600">{employee?.employeeId}</p>
      </div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {employee ? <EmployeeForm initialValue={employee} onSubmit={handleSubmit} submitting={submitting} submitLabel="Update Employee" /> : null}
    </div>
  )
}
