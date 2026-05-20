import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/authSlice'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
export const API_ROOT = import.meta.env.VITE_API_URL || `http://${defaultHost}:5000`

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  withCredentials: true
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/auth/logout')) {
        axios.post(`${API_ROOT}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {})
      }

      store.dispatch(logout())

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const assetUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${API_ROOT}${url}`
}

export default api
