import { useCallback, useEffect, useState } from 'react'
import { employeeApi } from '../api/employeeApi'

const EMPTY_PARAMS = Object.freeze({})

export function useEmployees(initialParams = EMPTY_PARAMS) {
  const [params, setParams] = useState(initialParams)
  const [employees, setEmployees] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (nextParams = params) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await employeeApi.list(nextParams)
      setEmployees(data.items || [])
      setPagination(data.pagination || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load employees')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    load(params)
  }, [load, params])

  return { employees, pagination, loading, error, params, setParams, reload: load }
}
