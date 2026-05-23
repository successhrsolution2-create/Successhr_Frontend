import { useCallback, useEffect, useState } from 'react'
import { payrollApi } from '../api/payrollApi'

const EMPTY_PARAMS = Object.freeze({})

export function usePayroll(params = EMPTY_PARAMS) {
  const [payroll, setPayroll] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await payrollApi.list(params)
      setPayroll(data.items || [])
      setPagination(data.pagination || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payroll')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    load()
  }, [load])

  return { payroll, pagination, loading, error, reload: load }
}
