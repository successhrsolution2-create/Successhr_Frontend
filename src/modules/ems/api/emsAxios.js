import axios from 'axios'
import { API_ROOT } from '../../../api/axios'

const readToken = () => {
  try {
    return localStorage.getItem('ems_token') || localStorage.getItem('token')
  } catch (_error) {
    return null
  }
}

const emsAxios = axios.create({
  baseURL: `${API_ROOT}/api/ems`,
  withCredentials: true
})

emsAxios.interceptors.request.use((config) => {
  const token = readToken()
  if (token && token !== 'cookie') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

emsAxios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default emsAxios
