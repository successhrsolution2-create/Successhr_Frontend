import axios from 'axios'
import { API_ROOT } from '../../../api/axios'

try {
  localStorage.removeItem('ems_token')
} catch (_error) {
  // Local storage can be unavailable in restricted browser modes.
}

const emsAxios = axios.create({
  baseURL: `${API_ROOT}/api/ems`,
  withCredentials: true
})

emsAxios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default emsAxios
