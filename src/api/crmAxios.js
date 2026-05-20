import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/authSlice'
import { API_ROOT } from './axios'

const crmApi = axios.create({
  baseURL: `${API_ROOT}/crm`,
  withCredentials: true
})

crmApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default crmApi
