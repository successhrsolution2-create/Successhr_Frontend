import { useCallback, useEffect, useState } from 'react'
import { leaveApi } from '../api/leaveApi'

const EMPTY_PARAMS = Object.freeze({})

export function useLeaves(params = EMPTY_PARAMS) {
  const [leaves, setLeaves] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await leaveApi.list(params)
      setLeaves(data.items || [])
      setPagination(data.pagination || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load leaves')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    load()
  }, [load])

  return { leaves, pagination, loading, error, reload: load }
}
