import { useEffect, useState } from 'react'
import { departmentApi } from '../api/departmentApi'

export default function DepartmentSelect({ value, onChange, className = '', includeEmpty = true }) {
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    let mounted = true
    departmentApi.list({ limit: 100 }).then(({ data }) => {
      if (mounted) setDepartments(data.items || [])
    }).catch(() => {
      if (mounted) setDepartments([])
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <select value={value || ''} onChange={(event) => onChange(event.target.value)} className={className}>
      {includeEmpty ? <option value="">All departments</option> : null}
      {departments.map((department) => (
        <option key={department._id} value={department._id}>
          {department.name}
        </option>
      ))}
    </select>
  )
}
