import { useCallback, useEffect, useState } from 'react'
import { attendanceApi } from '../api/attendanceApi'

const EMPTY_PARAMS = Object.freeze({})

export function useAttendance(mode = 'today', params = EMPTY_PARAMS) {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = mode === 'report' ? await attendanceApi.report(params) : await attendanceApi.today()
      setItems(data.items || [])
      setSummary(data.summary || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load attendance')
    } finally {
      setLoading(false)
    }
  }, [mode, params])

  useEffect(() => {
    load()
  }, [load])

  return { items, summary, loading, error, reload: load }
}
