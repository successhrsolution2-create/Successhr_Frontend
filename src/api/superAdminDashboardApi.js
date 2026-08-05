import api from './axios'

export const getSuperAdminDashboardSummary = () => api.get('/super-admin/dashboard-summary')
export const getSuperAdminCandidateChartData = (filter) => api.get(`/super-admin/candidate-chart-data?filter=${filter}`)
