import api from './axios'

export const getSuperAdminDashboardSummary = () => api.get('/super-admin/dashboard-summary')
