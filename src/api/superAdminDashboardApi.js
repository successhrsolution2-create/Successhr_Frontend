import api from './axios'

export const getSuperAdminDashboardSummary = () => api.get('/super-admin/dashboard-summary')
export const getSuperAdminCandidateChartData = (filter) => api.get(`/super-admin/candidate-chart-data?filter=${filter}`)
export const getSuperAdminCandidateDistribution = (filter = 'daily') => api.get(`/super-admin/candidate-distribution?filter=${filter}`)

