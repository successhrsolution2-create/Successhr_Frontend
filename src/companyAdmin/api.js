import axios from 'axios'

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_ROOT = import.meta.env.VITE_API_URL || `http://${defaultHost}:5000`

const companyAdminApi = axios.create({
  baseURL: `${API_ROOT}/api/company-admin`,
  withCredentials: true
})

export default companyAdminApi
